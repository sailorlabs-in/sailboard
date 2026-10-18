import { io, Socket } from 'socket.io-client';
import { UserPresence, CanvasElement, ProjectRole } from '@rea/shared-types';

class SocketService {
  private socket: Socket | null = null;
  private currentDocId: string | null = null;
  private currentUser: { id: string; name: string; color: string } | null = null;
  private currentRole: ProjectRole = 'editor';

  connect(): Socket {
    if (!this.socket) {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const serverUrl = `http://${host}:3333/whiteboard`;

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 50,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to whiteboard gateway:', this.socket?.id);
        if (this.currentDocId && this.currentUser) {
          this.socket?.emit('join-document', {
            documentId: this.currentDocId,
            user: this.currentUser,
            role: this.currentRole,
          });
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected from whiteboard gateway:', reason);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
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
    this.currentUser = user;
    this.currentRole = role;
    const s = this.connect();

    const sendJoin = () => {
      console.log(`[Socket] Joining document ${documentId} as ${user.name} (${role})`);
      s.emit('join-document', { documentId, user, role });
    };

    if (s.connected) {
      sendJoin();
    } else {
      s.once('connect', sendJoin);
    }
  }

  emitCursorMove(cursor: { x: number; y: number }, selectedElementIds?: string[]) {
    if (this.socket && this.currentDocId) {
      this.socket.emit('cursor-move', { documentId: this.currentDocId, cursor, selectedElementIds });
    }
  }

  emitSelectionChange(selectedElementIds: string[]) {
    if (this.socket && this.currentDocId) {
      this.socket.emit('selection-change', { documentId: this.currentDocId, selectedElementIds });
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
    const s = this.connect();
    s.on('users-update', callback);
    return () => s.off('users-update', callback);
  }

  onUserLeft(callback: (data: { userId: string }) => void) {
    const s = this.connect();
    s.on('user-left', callback);
    return () => s.off('user-left', callback);
  }

  onCursorUpdate(callback: (presence: UserPresence) => void) {
    const s = this.connect();
    s.on('cursor-update', callback);
    return () => s.off('cursor-update', callback);
  }

  onSelectionUpdate(callback: (data: { userId: string; userName: string; color: string; selectedElementIds: string[] }) => void) {
    const s = this.connect();
    s.on('selection-update', callback);
    return () => s.off('selection-update', callback);
  }

  onElementsUpdate(callback: (elements: CanvasElement[]) => void) {
    const s = this.connect();
    s.on('elements-update', callback);
    return () => s.off('elements-update', callback);
  }

  onNoteUpdate(callback: (notes: string) => void) {
    const s = this.connect();
    s.on('note-update', callback);
    return () => s.off('note-update', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
