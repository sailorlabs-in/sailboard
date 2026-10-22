import { io, Socket } from 'socket.io-client';
import { UserPresence, CanvasElement, ProjectRole } from '@rea/shared-types';

class SocketService {
  private socket: Socket | null = null;
  private currentDocId: string | null = null;
  private currentUser: { id: string; name: string; color: string } | null = null;
  private currentRole: ProjectRole = 'editor';

  // Throttling state for high-frequency events
  private elementsThrottleTimer: any = null;
  private pendingElements: CanvasElement[] | null = null;
  private lastElementsEmitTime = 0;

  private cursorThrottleTimer: any = null;
  private pendingCursor: { cursor: { x: number; y: number }; selectedElementIds?: string[] } | null = null;
  private lastCursorEmitTime = 0;

  private noteDebounceTimer: any = null;

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

  isConnected(): boolean {
    return !!this.socket?.connected;
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
    if (!this.socket || !this.currentDocId) return;

    const now = Date.now();
    const elapsed = now - this.lastCursorEmitTime;
    const THROTTLE_MS = 33; // 30fps throttle for cursor movements

    this.pendingCursor = { cursor, selectedElementIds };

    if (elapsed >= THROTTLE_MS) {
      this.lastCursorEmitTime = now;
      this.socket.emit('cursor-move', {
        documentId: this.currentDocId,
        cursor,
        selectedElementIds,
      });
      this.pendingCursor = null;
    } else if (!this.cursorThrottleTimer) {
      this.cursorThrottleTimer = setTimeout(() => {
        this.cursorThrottleTimer = null;
        if (this.pendingCursor && this.socket && this.currentDocId) {
          this.lastCursorEmitTime = Date.now();
          this.socket.emit('cursor-move', {
            documentId: this.currentDocId,
            cursor: this.pendingCursor.cursor,
            selectedElementIds: this.pendingCursor.selectedElementIds,
          });
          this.pendingCursor = null;
        }
      }, THROTTLE_MS - elapsed);
    }
  }

  emitSelectionChange(selectedElementIds: string[]) {
    if (this.socket && this.currentDocId) {
      this.socket.emit('selection-change', { documentId: this.currentDocId, selectedElementIds });
    }
  }

  emitElementsChange(elements: CanvasElement[], immediate = false) {
    if (!this.socket || !this.currentDocId) return;

    if (immediate) {
      if (this.elementsThrottleTimer) {
        clearTimeout(this.elementsThrottleTimer);
        this.elementsThrottleTimer = null;
      }
      this.pendingElements = null;
      this.lastElementsEmitTime = Date.now();
      this.socket.emit('elements-change', {
        documentId: this.currentDocId,
        elements,
        isFinal: true,
      });
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastElementsEmitTime;
    const THROTTLE_MS = 33; // ~30fps for smooth live multiplayer sync

    this.pendingElements = elements;

    if (elapsed >= THROTTLE_MS) {
      this.lastElementsEmitTime = now;
      this.socket.emit('elements-change', {
        documentId: this.currentDocId,
        elements,
        isFinal: false,
      });
      this.pendingElements = null;
    } else if (!this.elementsThrottleTimer) {
      this.elementsThrottleTimer = setTimeout(() => {
        this.elementsThrottleTimer = null;
        if (this.pendingElements && this.socket && this.currentDocId) {
          this.lastElementsEmitTime = Date.now();
          this.socket.emit('elements-change', {
            documentId: this.currentDocId,
            elements: this.pendingElements,
            isFinal: false,
          });
          this.pendingElements = null;
        }
      }, THROTTLE_MS - elapsed);
    }
  }

  emitNoteChange(notes: string) {
    if (!this.socket || !this.currentDocId) return;

    if (this.noteDebounceTimer) {
      clearTimeout(this.noteDebounceTimer);
    }

    this.noteDebounceTimer = setTimeout(() => {
      if (this.socket && this.currentDocId) {
        this.socket.emit('note-change', { documentId: this.currentDocId, notes });
      }
    }, 250);
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

  // --- Comments Real-time Events ---

  emitCommentCreate(comment: any, documentId?: string) {
    const docId = documentId || this.currentDocId || comment?.documentId;
    const s = this.connect();
    s.emit('comment-create', { documentId: docId, comment });
  }

  emitCommentUpdate(comment: any, documentId?: string) {
    const docId = documentId || this.currentDocId || comment?.documentId;
    const s = this.connect();
    s.emit('comment-update', { documentId: docId, comment });
  }

  emitCommentDelete(commentId: string, documentId?: string) {
    const docId = documentId || this.currentDocId;
    const s = this.connect();
    s.emit('comment-delete', { documentId: docId, commentId });
  }

  onCommentCreated(callback: (comment: any) => void) {
    const s = this.connect();
    s.on('comment-created', callback);
    return () => s.off('comment-created', callback);
  }

  onCommentUpdated(callback: (comment: any) => void) {
    const s = this.connect();
    s.on('comment-updated', callback);
    return () => s.off('comment-updated', callback);
  }

  onCommentDeleted(callback: (data: { commentId: string }) => void) {
    const s = this.connect();
    s.on('comment-deleted', callback);
    return () => s.off('comment-deleted', callback);
  }

  disconnect() {
    if (this.elementsThrottleTimer) clearTimeout(this.elementsThrottleTimer);
    if (this.cursorThrottleTimer) clearTimeout(this.cursorThrottleTimer);
    if (this.noteDebounceTimer) clearTimeout(this.noteDebounceTimer);
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
