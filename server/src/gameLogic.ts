import {
  type GameState,
  type Player,
  type Question,
  type FastMoneyQuestion,
  type TeamId,
  type FastMoneyResponse,
  FAST_MONEY_QUESTION_COUNT,
  BOARD_SIZE,
} from '@ff/shared';

export type Outcome = { ok: true } | { ok: false; error: string };

export function addPlayer(state: GameState, id: string, name: string): Player {
  const cleanName = name.trim().slice(0, 32) || 'Player';
  const player: Player = { id, name: cleanName, teamId: null, connected: true };
  state.players.push(player);
  return player;
}

export function reconnectPlayer(state: GameState, id: string): Outcome {
  const p = state.players.find((p) => p.id === id);
  if (!p) return { ok: false, error: 'Player not found' };
  p.connected = true;
  return { ok: true };
}

export function markPlayerDisconnected(state: GameState, id: string): void {
  const p = state.players.find((p) => p.id === id);
  if (p) p.connected = false;
}

export function pickTeam(
  state: GameState,
  playerId: string,
  teamId: TeamId,
  familyName: string | undefined,
): Outcome {
  if (state.phase !== 'LOBBY') return { ok: false, error: 'Cannot change team after game started' };
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, error: 'Player not found' };
  player.teamId = teamId;
  const team = state.teams[teamId];
  if (!team.familyName && familyName) {
    team.familyName = familyName.trim().slice(0, 32);
  }
  return { ok: true };
}

export function saveQuestions(
  state: GameState,
  rounds: Question[],
  fastMoney: FastMoneyQuestion[],
): Outcome {
  if (state.phase !== 'LOBBY') return { ok: false, error: 'Game already started' };
  state.rounds = rounds;
  state.fastMoney.questions = fastMoney;
  return { ok: true };
}

export function startGame(state: GameState): Outcome {
  if (state.phase !== 'LOBBY') return { ok: false, error: 'Game already started' };
  if (state.rounds.length === 0) return { ok: false, error: 'No rounds configured' };
  const t1 = state.players.filter((p) => p.teamId === 1).length;
  const t2 = state.players.filter((p) => p.teamId === 2).length;
  if (t1 === 0 || t2 === 0) return { ok: false, error: 'Both teams need at least one player' };
  if (!state.teams[1].familyName) state.teams[1].familyName = 'Team 1';
  if (!state.teams[2].familyName) state.teams[2].familyName = 'Team 2';
  state.phase = 'ROUND_ACTIVE';
  state.currentRoundIdx = 0;
  state.controllingTeamId = 1;
  state.stealingTeamId = null;
  state.pendingPoints = 0;
  state.teams[1].strikes = 0;
  state.teams[2].strikes = 0;
  state.teams[1].turnIndex = 0;
  state.teams[2].turnIndex = 0;
  return { ok: true };
}

function teamPlayers(state: GameState, teamId: TeamId): Player[] {
  return state.players.filter((p) => p.teamId === teamId);
}

function advanceTurn(state: GameState, teamId: TeamId): void {
  const players = teamPlayers(state, teamId);
  if (players.length === 0) return;
  state.teams[teamId].turnIndex = (state.teams[teamId].turnIndex + 1) % players.length;
}

export function revealBox(state: GameState, answerIdx: number): Outcome {
  if (state.phase !== 'ROUND_ACTIVE' && state.phase !== 'ROUND_STEAL') {
    return { ok: false, error: 'Not in a guessing phase' };
  }
  const round = state.rounds[state.currentRoundIdx];
  if (!round) return { ok: false, error: 'No active round' };
  if (answerIdx < 0 || answerIdx >= BOARD_SIZE) return { ok: false, error: 'Invalid box' };
  const answer = round.answers[answerIdx];
  if (!answer || !answer.text) return { ok: false, error: 'Box is empty' };
  if (answer.revealed) return { ok: false, error: 'Already revealed' };
  answer.revealed = true;
  state.pendingPoints += answer.points;

  if (state.phase === 'ROUND_STEAL') {
    if (state.stealingTeamId) {
      state.teams[state.stealingTeamId].score += state.pendingPoints;
    }
    state.pendingPoints = 0;
    state.phase = 'ROUND_RESOLVED';
    return { ok: true };
  }

  if (state.phase === 'ROUND_ACTIVE' && state.controllingTeamId) {
    advanceTurn(state, state.controllingTeamId);
    if (allRevealed(round)) {
      state.teams[state.controllingTeamId].score += state.pendingPoints;
      state.pendingPoints = 0;
      state.phase = 'ROUND_RESOLVED';
    }
  }

  return { ok: true };
}

function allRevealed(round: Question): boolean {
  return round.answers.every((a) => !a.text || a.revealed);
}

export function denyAnswer(state: GameState): Outcome {
  if (state.phase === 'ROUND_ACTIVE') {
    const teamId = state.controllingTeamId;
    if (!teamId) return { ok: false, error: 'No controlling team' };
    const team = state.teams[teamId];
    team.strikes = Math.min(2, team.strikes + 1) as 0 | 1 | 2;
    if (team.strikes >= 2) {
      const otherId: TeamId = teamId === 1 ? 2 : 1;
      state.phase = 'ROUND_STEAL';
      state.stealingTeamId = otherId;
    } else {
      advanceTurn(state, teamId);
    }
    return { ok: true };
  }
  if (state.phase === 'ROUND_STEAL') {
    return resolveSteal(state, false);
  }
  return { ok: false, error: 'Not in a guessing phase' };
}

export function resolveSteal(state: GameState, stealSucceeded: boolean): Outcome {
  if (state.phase !== 'ROUND_STEAL') return { ok: false, error: 'Not in steal phase' };
  const stealing = state.stealingTeamId;
  const original = state.controllingTeamId;
  if (!stealing || !original) return { ok: false, error: 'Missing team state' };
  const winner = stealSucceeded ? stealing : original;
  state.teams[winner].score += state.pendingPoints;
  state.pendingPoints = 0;
  state.phase = 'ROUND_RESOLVED';
  return { ok: true };
}

export function nextRound(state: GameState): Outcome {
  if (state.phase !== 'ROUND_RESOLVED') return { ok: false, error: 'Round not resolved' };
  const nextIdx = state.currentRoundIdx + 1;
  if (nextIdx >= state.rounds.length) {
    if (state.fastMoney.questions.some((q) => q.prompt.trim())) {
      state.phase = 'FAST_MONEY_SETUP';
    } else {
      state.phase = 'GAME_END';
    }
    return { ok: true };
  }
  state.currentRoundIdx = nextIdx;
  state.phase = 'ROUND_ACTIVE';
  state.controllingTeamId = ((nextIdx % 2) + 1) as TeamId;
  state.stealingTeamId = null;
  state.pendingPoints = 0;
  state.teams[1].strikes = 0;
  state.teams[2].strikes = 0;
  return { ok: true };
}

export function assignFastMoneyPlayers(state: GameState, p1Id: string, p2Id: string): Outcome {
  if (state.phase !== 'FAST_MONEY_SETUP') return { ok: false, error: 'Not in fast money setup' };
  if (p1Id === p2Id) return { ok: false, error: 'Players must be different' };
  const p1 = state.players.find((p) => p.id === p1Id);
  const p2 = state.players.find((p) => p.id === p2Id);
  if (!p1 || !p2) return { ok: false, error: 'Player not found' };
  if (!p1.teamId || !p2.teamId) return { ok: false, error: 'Both players must be on a team' };
  state.fastMoney.p1Id = p1Id;
  state.fastMoney.p2Id = p2Id;
  state.fastMoney.p1Responses = Array(FAST_MONEY_QUESTION_COUNT).fill(null);
  state.fastMoney.p2Responses = Array(FAST_MONEY_QUESTION_COUNT).fill(null);
  state.fastMoney.revealedIdx = -1;
  return { ok: true };
}

export function startFastMoneyP1(state: GameState): Outcome {
  if (state.phase !== 'FAST_MONEY_SETUP') return { ok: false, error: 'Not in setup' };
  if (!state.fastMoney.p1Id || !state.fastMoney.p2Id) return { ok: false, error: 'Players not assigned' };
  state.phase = 'FAST_MONEY_P1';
  state.fastMoney.timerStartedAt = Date.now();
  return { ok: true };
}

export function startFastMoneyP2(state: GameState): Outcome {
  if (state.phase !== 'FAST_MONEY_P1_DONE') return { ok: false, error: 'P1 round not finished' };
  state.phase = 'FAST_MONEY_P2';
  state.fastMoney.timerStartedAt = Date.now();
  return { ok: true };
}

export function endFastMoneyP1(state: GameState): Outcome {
  if (state.phase !== 'FAST_MONEY_P1') return { ok: false, error: 'Not in P1' };
  state.phase = 'FAST_MONEY_P1_DONE';
  state.fastMoney.timerStartedAt = null;
  return { ok: true };
}

export function endFastMoneyP2(state: GameState): Outcome {
  if (state.phase !== 'FAST_MONEY_P2') return { ok: false, error: 'Not in P2' };
  state.phase = 'FAST_MONEY_REVEAL';
  state.fastMoney.timerStartedAt = null;
  state.fastMoney.revealedIdx = -1;
  return { ok: true };
}

export function recordFastMoneyResponse(
  state: GameState,
  player: 1 | 2,
  qIdx: number,
  text: string,
  points: number,
  duplicate: boolean,
): Outcome {
  if (qIdx < 0 || qIdx >= FAST_MONEY_QUESTION_COUNT) return { ok: false, error: 'Invalid question index' };
  const cleanText = String(text ?? '').slice(0, 200).trim();
  const cleanPoints = Math.max(0, Math.min(99, Math.floor(Number(points) || 0)));
  const response: FastMoneyResponse = { text: cleanText, points: cleanPoints, duplicate };
  if (player === 1) {
    if (state.phase !== 'FAST_MONEY_P1' && state.phase !== 'FAST_MONEY_P1_DONE') {
      return { ok: false, error: 'Not in P1 phase' };
    }
    state.fastMoney.p1Responses[qIdx] = response;
  } else {
    if (state.phase !== 'FAST_MONEY_P2' && state.phase !== 'FAST_MONEY_REVEAL') {
      return { ok: false, error: 'Not in P2 phase' };
    }
    state.fastMoney.p2Responses[qIdx] = response;
  }
  return { ok: true };
}

export function revealFastMoneyNext(state: GameState): Outcome {
  if (state.phase !== 'FAST_MONEY_REVEAL') return { ok: false, error: 'Not in reveal phase' };
  const next = state.fastMoney.revealedIdx + 1;
  const total = FAST_MONEY_QUESTION_COUNT * 2;
  if (next >= total) {
    state.phase = 'GAME_END';
    state.fastMoney.revealedIdx = total - 1;
    awardFastMoneyBonus(state);
    return { ok: true };
  }
  state.fastMoney.revealedIdx = next;
  if (next === total - 1) {
    awardFastMoneyBonus(state);
    state.phase = 'GAME_END';
  }
  return { ok: true };
}

function awardFastMoneyBonus(state: GameState): void {
  const total = fastMoneyTotal(state);
  if (total >= state.fastMoney.targetScore) {
    const winningTeam = leadingTeam(state);
    if (winningTeam) state.teams[winningTeam].score += 5 * state.fastMoney.targetScore;
  }
}

export function fastMoneyTotal(state: GameState): number {
  const sum = (arr: (FastMoneyResponse | null)[]) =>
    arr.reduce((acc, r) => acc + (r && !r.duplicate ? r.points : 0), 0);
  return sum(state.fastMoney.p1Responses) + sum(state.fastMoney.p2Responses);
}

function leadingTeam(state: GameState): TeamId | null {
  const a = state.teams[1].score;
  const b = state.teams[2].score;
  if (a > b) return 1;
  if (b > a) return 2;
  return null;
}
