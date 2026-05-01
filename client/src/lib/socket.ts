import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@ff/shared';

export type FeudSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: FeudSocket | null = null;

export function getSocket(): FeudSocket {
  if (!socket) {
    socket = io({ autoConnect: true });
  }
  return socket;
}
