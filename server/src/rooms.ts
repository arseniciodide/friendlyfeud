import { randomUUID } from 'node:crypto';
import {
  BOARD_SIZE,
  FAST_MONEY_P1_DURATION_MS,
  FAST_MONEY_P2_DURATION_MS,
  FAST_MONEY_QUESTION_COUNT,
  FAST_MONEY_TARGET_SCORE,
  type GameState,
  type Question,
  type FastMoneyQuestion,
} from '@ff/shared';

export type Room = {
  state: GameState;
  hostToken: string;
  hostSocketId: string | null;
  hostDisconnectedAt: number | null;
  playerSockets: Map<string, string>;
};

const rooms = new Map<string, Room>();

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function randomCode(): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export function generateRoomCode(): string {
  for (let i = 0; i < 50; i++) {
    const code = randomCode();
    if (!rooms.has(code)) return code;
  }
  throw new Error('Could not generate unique room code');
}

export function createInitialState(roomCode: string): GameState {
  return {
    roomCode,
    hostConnected: true,
    phase: 'LOBBY',
    players: [],
    teams: {
      1: { id: 1, familyName: '', score: 0, strikes: 0, turnIndex: 0 },
      2: { id: 2, familyName: '', score: 0, strikes: 0, turnIndex: 0 },
    },
    rounds: [],
    currentRoundIdx: 0,
    controllingTeamId: null,
    stealingTeamId: null,
    pendingPoints: 0,
    fastMoney: {
      questions: [],
      p1Id: null,
      p2Id: null,
      p1Responses: Array(FAST_MONEY_QUESTION_COUNT).fill(null),
      p2Responses: Array(FAST_MONEY_QUESTION_COUNT).fill(null),
      p1DurationMs: FAST_MONEY_P1_DURATION_MS,
      p2DurationMs: FAST_MONEY_P2_DURATION_MS,
      timerStartedAt: null,
      revealedIdx: -1,
      targetScore: FAST_MONEY_TARGET_SCORE,
    },
  };
}

export function createRoom(): { room: Room; hostToken: string } {
  const code = generateRoomCode();
  const hostToken = randomUUID();
  const room: Room = {
    state: createInitialState(code),
    hostToken,
    hostSocketId: null,
    hostDisconnectedAt: null,
    playerSockets: new Map(),
  };
  rooms.set(code, room);
  return { room, hostToken };
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function listRooms(): Room[] {
  return Array.from(rooms.values());
}

export function sanitizeQuestions(rounds: Question[]): Question[] {
  return rounds.map((r) => ({
    prompt: String(r.prompt ?? '').slice(0, 500),
    answers: Array.from({ length: BOARD_SIZE }, (_, i) => {
      const a = r.answers?.[i];
      return {
        text: String(a?.text ?? '').slice(0, 200),
        points: Math.max(0, Math.min(999, Math.floor(Number(a?.points ?? 0)))),
        revealed: false,
      };
    }),
  }));
}

export function sanitizeFastMoneyQuestions(qs: FastMoneyQuestion[]): FastMoneyQuestion[] {
  const out: FastMoneyQuestion[] = [];
  for (let i = 0; i < FAST_MONEY_QUESTION_COUNT; i++) {
    out.push({ prompt: String(qs[i]?.prompt ?? '').slice(0, 500) });
  }
  return out;
}
