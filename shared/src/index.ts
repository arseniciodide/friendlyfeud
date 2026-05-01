export const BOARD_SIZE = 8;
export const FAST_MONEY_QUESTION_COUNT = 5;
export const FAST_MONEY_P1_DURATION_MS = 20_000;
export const FAST_MONEY_P2_DURATION_MS = 25_000;
export const FAST_MONEY_TARGET_SCORE = 200;
export const HOST_RECONNECT_GRACE_MS = 60_000;

export type TeamId = 1 | 2;

export type Phase =
  | 'LOBBY'
  | 'ROUND_ACTIVE'
  | 'ROUND_STEAL'
  | 'ROUND_RESOLVED'
  | 'FAST_MONEY_SETUP'
  | 'FAST_MONEY_P1'
  | 'FAST_MONEY_P1_DONE'
  | 'FAST_MONEY_P2'
  | 'FAST_MONEY_REVEAL'
  | 'GAME_END';

export type Answer = {
  text: string;
  points: number;
  revealed: boolean;
};

export type Question = {
  prompt: string;
  answers: Answer[];
};

export type FastMoneyQuestion = {
  prompt: string;
};

export type FastMoneyResponse = {
  text: string;
  points: number;
  duplicate: boolean;
};

export type Player = {
  id: string;
  name: string;
  teamId: TeamId | null;
  connected: boolean;
};

export type Team = {
  id: TeamId;
  familyName: string;
  score: number;
  strikes: 0 | 1 | 2;
  turnIndex: number;
};

export type FastMoneyState = {
  questions: FastMoneyQuestion[];
  p1Id: string | null;
  p2Id: string | null;
  p1Responses: (FastMoneyResponse | null)[];
  p2Responses: (FastMoneyResponse | null)[];
  p1DurationMs: number;
  p2DurationMs: number;
  timerStartedAt: number | null;
  revealedIdx: number;
  targetScore: number;
};

export type GameState = {
  roomCode: string;
  hostConnected: boolean;
  phase: Phase;
  players: Player[];
  teams: { 1: Team; 2: Team };
  rounds: Question[];
  currentRoundIdx: number;
  controllingTeamId: TeamId | null;
  stealingTeamId: TeamId | null;
  pendingPoints: number;
  fastMoney: FastMoneyState;
};

export type PublicGameState = Omit<GameState, 'rounds' | 'fastMoney'> & {
  rounds: Question[];
  fastMoney: Omit<FastMoneyState, 'p1Responses'> & {
    p1Responses: (FastMoneyResponse | null)[];
  };
};

export type ClientToServerEvents = {
  'host:create': (
    ack: (res: { ok: true; roomCode: string; hostToken: string } | { ok: false; error: string }) => void,
  ) => void;
  'host:reconnect': (
    payload: { roomCode: string; hostToken: string },
    ack: (res: { ok: boolean; error?: string }) => void,
  ) => void;
  'player:join': (
    payload: { roomCode: string; name: string; playerId?: string },
    ack: (res: { ok: true; playerId: string } | { ok: false; error: string }) => void,
  ) => void;
  'player:pickTeam': (payload: { teamId: TeamId; familyName?: string }) => void;
  'host:saveQuestions': (payload: { rounds: Question[]; fastMoneyQuestions: FastMoneyQuestion[] }) => void;
  'host:startGame': () => void;
  'host:revealBox': (payload: { answerIdx: number }) => void;
  'host:denyAnswer': () => void;
  'host:resolveSteal': (payload: { stealSucceeded: boolean }) => void;
  'host:nextRound': () => void;
  'host:assignFastMoneyPlayers': (payload: { p1Id: string; p2Id: string }) => void;
  'host:startFastMoneyP1': () => void;
  'host:startFastMoneyP2': () => void;
  'host:recordFastMoneyResponse': (payload: {
    player: 1 | 2;
    qIdx: number;
    text: string;
    points: number;
    duplicate?: boolean;
  }) => void;
  'host:revealFastMoney': () => void;
  'host:revealFastMoneyNext': () => void;
  'player:submitFastMoneyAnswer': (payload: { qIdx: number; text: string }) => void;
};

export type ServerToClientEvents = {
  'room:state': (state: PerspectiveState) => void;
  'room:error': (payload: { message: string }) => void;
  'fastmoney:tick': (payload: { remainingMs: number }) => void;
  'fastmoney:pendingAnswer': (payload: { player: 1 | 2; qIdx: number; text: string }) => void;
};

export type Perspective = 'host' | 'player' | 'spectator';

export type PerspectiveState = {
  perspective: Perspective;
  selfId: string | null;
  publicState: PublicGameState;
  hostView?: {
    rounds: Question[];
    pendingFastMoneyAnswer: { player: 1 | 2; qIdx: number; text: string } | null;
    p2Responses: (FastMoneyResponse | null)[];
  };
};

export function emptyAnswer(): Answer {
  return { text: '', points: 0, revealed: false };
}

export function emptyQuestion(): Question {
  return { prompt: '', answers: Array.from({ length: BOARD_SIZE }, emptyAnswer) };
}

export function emptyFastMoneyQuestion(): FastMoneyQuestion {
  return { prompt: '' };
}
