import { io, Socket } from 'socket.io-client';
import { UserPresence, CanvasElement, ProjectRole } from '@rea/shared-types';

class SocketService {
  private socket: Socket | null = null;
  private currentDocId: string | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io('/whiteboard', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to whiteboard gateway:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from whiteboard gateway');
      });
    }
    return this.socket;
  }

  joinDocument(
    documentId: string,
    user: { id: string; name: string; color: string },
    role: ProjectRole = 'editor'
  ) {
    this.currentDocId = documentId;
    const s = this.connect();
    s.emit('join-document', { documentId, user, role });
  }

  emitCursorMove(cursor: { x: number; y: number }) {
    if (this.socket && this.currentDocId) {
      this.socket.emit('cursor-move', { documentId: this.currentDocId, cursor });
    }
  }

  emitElementsChange(elements: CanvasElement[]) {
    if (this.socket && this.currentDocId) {
      this.socket.emit('elements-change', { documentId: this.currentDocId, elements });
    }
  }

  emitNoteChange(notes: string) {
    if (this.socket && this.currentDocId) {
      this.socket.emit('note-change', { documentId: this.currentDocId, notes });
    }
  }

  onUsersUpdate(callback: (users: UserPresence[]) => void) {
    this.socket?.on('users-update', callback);
    return () => this.socket?.off('users-update', callback);
  }

  onCursorUpdate(callback: (presence: UserPresence) => void) {
    this.socket?.on('cursor-update', callback);
    return () => this.socket?.off('cursor-update', callback);
  }

  onElementsUpdate(callback: (elements: CanvasElement[]) => void) {
    this.socket?.on('elements-update', callback);
    return () => this.socket?.off('elements-update', callback);
  }

  onNoteUpdate(callback: (notes: string) => void) {
    this.socket?.on('note-update', callback);
    return () => this.socket?.off('note-update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
