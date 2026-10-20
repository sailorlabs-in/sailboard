import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject } from '@nestjs/common';
import { UserPresence, CanvasElement, ProjectRole } from '@rea/shared-types';
import { WhiteboardService } from './whiteboard.service';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/whiteboard',
})
export class WhiteboardGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WhiteboardGateway.name);
  private userRooms: Map<
    string,
    { documentId: string; userId: string; userName: string; color: string; role: ProjectRole }
  > = new Map();

  constructor(
    @Inject(WhiteboardService)
    private readonly whiteboardService: WhiteboardService,
    @Inject(RedisService)
    private readonly redisService: RedisService
  ) {}

  afterInit() {
    this.logger.log('Sailboard WebSocket Gateway initialized with Redis Pub/Sub!');

    // Listen to Redis Pub/Sub events for cross-instance broadcasts
    this.redisService.subscribe('canvas:cursor', (data: any) => {
      if (data && data.documentId && data.userPresence) {
        if (data.senderSocketId) {
          const s = this.server.sockets?.sockets?.get(data.senderSocketId);
          if (s) return; // already sent directly to peers on this instance
        }
        this.server.to(data.documentId).emit('cursor-update', data.userPresence);
      }
    });

    this.redisService.subscribe('canvas:selection', (data: any) => {
      if (data && data.documentId) {
        if (data.senderSocketId) {
          const s = this.server.sockets?.sockets?.get(data.senderSocketId);
          if (s) return;
        }
        this.server.to(data.documentId).emit('selection-update', {
          userId: data.userId,
          userName: data.userName,
          color: data.color,
          selectedElementIds: data.selectedElementIds,
        });
      }
    });

    this.redisService.subscribe('canvas:elements', (data: any) => {
      if (data && data.documentId && data.elements) {
        if (data.senderSocketId) {
          const s = this.server.sockets?.sockets?.get(data.senderSocketId);
          if (s) return;
        }
        this.server.to(data.documentId).emit('elements-update', data.elements);
      }
    });

    this.redisService.subscribe('canvas:note', (data: any) => {
      if (data && data.documentId && data.notes) {
        this.server.to(data.documentId).emit('note-update', data.notes);
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const meta = this.userRooms.get(client.id);
    if (meta) {
      await this.redisService.removeUserPresence(meta.documentId, meta.userId);
      const remainingUsers = await this.redisService.getPresences(meta.documentId);
      this.server.to(meta.documentId).emit('users-update', remainingUsers);
      this.server.to(meta.documentId).emit('user-left', { userId: meta.userId });
      this.userRooms.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-document')
  async handleJoinDocument(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {
      documentId: string;
      user: { id: string; name: string; color: string };
      role?: ProjectRole;
    }
  ) {
    const { documentId, user, role = 'editor' } = payload;
    client.join(documentId);

    const userId = user?.id || client.id;
    const userName = user?.name || `User ${client.id.slice(0, 4)}`;
    const userColor = user?.color || '#6366f1';

    this.userRooms.set(client.id, { documentId, userId, userName, color: userColor, role });

    const presence: UserPresence = {
      userId,
      userName,
      color: userColor,
      role,
      cursor: null,
      selectedElementIds: [],
      lastActive: Date.now(),
    };

    // Store in Redis
    await this.redisService.setUserPresence(documentId, presence);

    // Fetch all active presences from Redis and broadcast to room
    const allUsers = await this.redisService.getPresences(documentId);
    this.server.to(documentId).emit('users-update', allUsers);
  }

  @SubscribeMessage('cursor-move')
  async handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; cursor: { x: number; y: number }; selectedElementIds?: string[] }
  ) {
    const { documentId, cursor, selectedElementIds } = payload;
    const meta = this.userRooms.get(client.id);
    if (meta) {
      const presence: UserPresence = {
        userId: meta.userId,
        userName: meta.userName,
        color: meta.color,
        role: meta.role,
        cursor,
        selectedElementIds: selectedElementIds || [],
        lastActive: Date.now(),
      };
      // Direct instant peer broadcast (User B sees User A's cursor move in real-time)
      client.to(documentId).emit('cursor-update', presence);

      // Broadcast via Redis Pub/Sub
      await this.redisService.publish('canvas:cursor', {
        documentId,
        userPresence: presence,
        senderSocketId: client.id,
      });
    }
  }

  @SubscribeMessage('selection-change')
  async handleSelectionChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; selectedElementIds: string[] }
  ) {
    const { documentId, selectedElementIds = [] } = payload;
    const meta = this.userRooms.get(client.id);
    if (meta) {
      const updateData = {
        userId: meta.userId,
        userName: meta.userName,
        color: meta.color,
        selectedElementIds,
      };

      // Direct instant peer broadcast for live Figma-style selection highlight
      client.to(documentId).emit('selection-update', updateData);

      // Update in Redis
      await this.redisService.setUserPresence(documentId, {
        userId: meta.userId,
        userName: meta.userName,
        color: meta.color,
        role: meta.role,
        cursor: null,
        selectedElementIds,
        lastActive: Date.now(),
      });

      // Broadcast via Redis Pub/Sub
      await this.redisService.publish('canvas:selection', {
        documentId,
        ...updateData,
        senderSocketId: client.id,
      });
    }
  }

  @SubscribeMessage('elements-change')
  async handleElementsChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; elements: CanvasElement[] }
  ) {
    const { documentId, elements } = payload;
    const meta = this.userRooms.get(client.id);

    // Enforce permission: Viewers cannot edit!
    if (meta && meta.role === 'viewer') {
      this.logger.warn(`User ${meta.userId} is a viewer and attempted to edit elements. Rejected.`);
      return;
    }

    // Immediately broadcast to other clients in this room (User B sees it live!)
    client.to(documentId).emit('elements-update', elements);

    // Publish to Redis channel for multi-server synchronization
    await this.redisService.publish('canvas:elements', { documentId, elements });

    // Persist to PostgreSQL via TypeORM
    await this.whiteboardService.syncElements(documentId, elements);
  }

  @SubscribeMessage('note-change')
  async handleNoteChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; notes: string }
  ) {
    const { documentId, notes } = payload;
    const meta = this.userRooms.get(client.id);

    // Enforce permission: Viewers cannot edit!
    if (meta && meta.role === 'viewer') {
      this.logger.warn(`User ${meta.userId} is a viewer and attempted to edit notes. Rejected.`);
      return;
    }

    // Immediately broadcast to other clients in this room
    client.to(documentId).emit('note-update', notes);

    // Publish to Redis channel
    await this.redisService.publish('canvas:note', { documentId, notes });

    // Persist to PostgreSQL via TypeORM
    await this.whiteboardService.update(documentId, { notes });
  }

  @SubscribeMessage('comment-create')
  async handleCommentCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; comment: any }
  ) {
    const { documentId, comment } = payload;
    client.to(documentId).emit('comment-created', comment);
  }

  @SubscribeMessage('comment-update')
  async handleCommentUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; comment: any }
  ) {
    const { documentId, comment } = payload;
    client.to(documentId).emit('comment-updated', comment);
  }

  @SubscribeMessage('comment-delete')
  async handleCommentDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { documentId: string; commentId: string }
  ) {
    const { documentId, commentId } = payload;
    client.to(documentId).emit('comment-deleted', { commentId });
  }
}
