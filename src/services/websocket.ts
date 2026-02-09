import { io, Socket } from 'socket.io-client';
import { SeatAvailability } from './api';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(WS_URL, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinShowtime(showtimeId: string) {
    if (this.socket) {
      this.socket.emit('join-showtime', { showtimeId });
    }
  }

  leaveShowtime(showtimeId: string) {
    if (this.socket) {
      this.socket.emit('leave-showtime', { showtimeId });
    }
  }

  onSeatUpdate(callback: (data: SeatAvailability) => void) {
    if (this.socket) {
      this.socket.on('seat-update', callback);
    }
  }

  offSeatUpdate(callback?: (data: SeatAvailability) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('seat-update', callback);
      } else {
        this.socket.off('seat-update');
      }
    }
  }
}

export const wsService = new WebSocketService();
