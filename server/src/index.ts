import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  HOST_RECONNECT_GRACE_MS,
} from '@ff/shared';
import {
  createRoom,
  getRoom,
  deleteRoom,
  listRooms,
  sanitizeFastMoneyQuestions,
  sanitizeQuestions,
  type Room,
} from './rooms.js';
import * as logic from './gameLogic.js';
import { buildPerspectiveState } from './perspective.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.NODE_ENV === 'production' ? false : '*' },
});

app.get('/health', (_req, res) => res.json({ ok: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

type SocketRole =
  | { kind: 'host'; roomCode: string }
  | { kind: 'player'; roomCode: string; playerId: string }
  | null;

const socketRoles = new Map<string, SocketRole>();
const pendingFastMoneyAnswers = new Map<
  string,
  { player: 1 | 2; qIdx: number; text: string } | null
>();

function broadcastRoom(room: Room): void {
  const sockets = io.sockets.adapter.rooms.get(room.state.roomCode);
  if (!sockets) return;
  for (const sid of sockets) {
    const role = socketRoles.get(sid);
    if (!role) continue;
    const pending = pendingFastMoneyAnswers.get(room.state.roomCode) ?? null;
    if (role.kind === 'host') {
      io.to(sid).emit('room:state', buildPerspectiveState(room.state, 'host', null, pending));
    } else {
      io.to(sid).emit('room:state', buildPerspectiveState(room.state, 'player', role.playerId, pending));
    }
  }
}

function ensureHost(socketId: string, room: Room): boolean {
  return room.hostSocketId === socketId;
}

function emitError(socketId: string, message: string): void {
  io.to(socketId).emit('room:error', { message });
}

io.on('connection', (socket) => {
  socket.on('host:create', (ack) => {
    const { room, hostToken } = createRoom();
    room.hostSocketId = socket.id;
    socketRoles.set(socket.id, { kind: 'host', roomCode: room.state.roomCode });
    socket.join(room.state.roomCode);
    ack({ ok: true, roomCode: room.state.roomCode, hostToken });
    broadcastRoom(room);
  });

  socket.on('host:reconnect', ({ roomCode, hostToken }, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostToken !== hostToken) {
      ack({ ok: false, error: 'Invalid room or token' });
      return;
    }
    room.hostSocketId = socket.id;
    room.hostDisconnectedAt = null;
    room.state.hostConnected = true;
    socketRoles.set(socket.id, { kind: 'host', roomCode: room.state.roomCode });
    socket.join(room.state.roomCode);
    ack({ ok: true });
    broadcastRoom(room);
  });

  socket.on('player:join', ({ roomCode, name, playerId }, ack) => {
    const room = getRoom(roomCode);
    if (!room) {
      ack({ ok: false, error: 'Room not found' });
      return;
    }
    let id = playerId;
    if (id && room.state.players.find((p) => p.id === id)) {
      logic.reconnectPlayer(room.state, id);
    } else {
      if (room.state.phase !== 'LOBBY') {
        ack({ ok: false, error: 'Game already started' });
        return;
      }
      id = randomUUID();
      logic.addPlayer(room.state, id, name);
    }
    room.playerSockets.set(id, socket.id);
    socketRoles.set(socket.id, { kind: 'player', roomCode: room.state.roomCode, playerId: id });
    socket.join(room.state.roomCode);
    ack({ ok: true, playerId: id });
    broadcastRoom(room);
  });

  socket.on('player:pickTeam', ({ teamId, familyName }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'player') return;
    const room = getRoom(role.roomCode);
    if (!room) return;
    const result = logic.pickTeam(room.state, role.playerId, teamId, familyName);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:saveQuestions', ({ rounds, fastMoneyQuestions }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.saveQuestions(
      room.state,
      sanitizeQuestions(rounds),
      sanitizeFastMoneyQuestions(fastMoneyQuestions),
    );
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:startGame', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.startGame(room.state);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:revealBox', ({ answerIdx }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.revealBox(room.state, answerIdx);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:denyAnswer', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.denyAnswer(room.state);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:resolveSteal', ({ stealSucceeded }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.resolveSteal(room.state, stealSucceeded);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:nextRound', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.nextRound(room.state);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:assignFastMoneyPlayers', ({ p1Id, p2Id }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.assignFastMoneyPlayers(room.state, p1Id, p2Id);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:startFastMoneyP1', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.startFastMoneyP1(room.state);
    if (!result.ok) emitError(socket.id, result.error);
    startFastMoneyTimer(room, room.state.fastMoney.p1DurationMs, () => {
      logic.endFastMoneyP1(room.state);
      broadcastRoom(room);
    });
    broadcastRoom(room);
  });

  socket.on('host:startFastMoneyP2', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.startFastMoneyP2(room.state);
    if (!result.ok) emitError(socket.id, result.error);
    startFastMoneyTimer(room, room.state.fastMoney.p2DurationMs, () => {
      logic.endFastMoneyP2(room.state);
      broadcastRoom(room);
    });
    broadcastRoom(room);
  });

  socket.on('host:recordFastMoneyResponse', ({ player, qIdx, text, points, duplicate }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.recordFastMoneyResponse(
      room.state,
      player,
      qIdx,
      text,
      points,
      Boolean(duplicate),
    );
    if (!result.ok) emitError(socket.id, result.error);
    pendingFastMoneyAnswers.set(room.state.roomCode, null);
    broadcastRoom(room);
  });

  socket.on('host:revealFastMoneyNext', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    const result = logic.revealFastMoneyNext(room.state);
    if (!result.ok) emitError(socket.id, result.error);
    broadcastRoom(room);
  });

  socket.on('host:revealFastMoney', () => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'host') return;
    const room = getRoom(role.roomCode);
    if (!room || !ensureHost(socket.id, room)) return;
    if (room.state.phase === 'FAST_MONEY_P2') {
      logic.endFastMoneyP2(room.state);
    }
    broadcastRoom(room);
  });

  socket.on('player:submitFastMoneyAnswer', ({ qIdx, text }) => {
    const role = socketRoles.get(socket.id);
    if (!role || role.kind !== 'player') return;
    const room = getRoom(role.roomCode);
    if (!room) return;
    const fm = room.state.fastMoney;
    const player: 1 | 2 | null =
      role.playerId === fm.p1Id ? 1 : role.playerId === fm.p2Id ? 2 : null;
    if (!player) return;
    const cleanText = String(text ?? '').slice(0, 200);
    pendingFastMoneyAnswers.set(room.state.roomCode, { player, qIdx, text: cleanText });
    if (room.hostSocketId) {
      io.to(room.hostSocketId).emit('fastmoney:pendingAnswer', { player, qIdx, text: cleanText });
    }
    broadcastRoom(room);
  });

  socket.on('disconnect', () => {
    const role = socketRoles.get(socket.id);
    socketRoles.delete(socket.id);
    if (!role) return;
    const room = getRoom(role.roomCode);
    if (!room) return;
    if (role.kind === 'host') {
      room.hostSocketId = null;
      room.hostDisconnectedAt = Date.now();
      room.state.hostConnected = false;
      broadcastRoom(room);
    } else {
      logic.markPlayerDisconnected(room.state, role.playerId);
      room.playerSockets.delete(role.playerId);
      broadcastRoom(room);
    }
  });
});

function startFastMoneyTimer(room: Room, durationMs: number, onEnd: () => void): void {
  const startAt = room.state.fastMoney.timerStartedAt;
  if (!startAt) return;
  const interval = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, durationMs - (now - startAt));
    io.to(room.state.roomCode).emit('fastmoney:tick', { remainingMs: remaining });
    if (remaining <= 0 || room.state.fastMoney.timerStartedAt !== startAt) {
      clearInterval(interval);
      if (room.state.fastMoney.timerStartedAt === startAt) {
        onEnd();
      }
    }
  }, 250);
}

setInterval(() => {
  const now = Date.now();
  for (const room of listRooms()) {
    if (
      room.hostSocketId === null &&
      room.hostDisconnectedAt &&
      now - room.hostDisconnectedAt > HOST_RECONNECT_GRACE_MS
    ) {
      deleteRoom(room.state.roomCode);
    }
  }
}, 30_000);

httpServer.listen(PORT, () => {
  console.log(`FriendlyFeud server listening on http://localhost:${PORT}`);
});
