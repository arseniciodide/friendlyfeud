import {
  type GameState,
  type PerspectiveState,
  type Question,
  type Perspective,
} from '@ff/shared';

export function buildPerspectiveState(
  state: GameState,
  perspective: Perspective,
  selfId: string | null,
  pendingFastMoneyAnswer: { player: 1 | 2; qIdx: number; text: string } | null,
): PerspectiveState {
  const isHost = perspective === 'host';
  const isP2DuringP1 = !isHost && selfId === state.fastMoney.p2Id && state.phase === 'FAST_MONEY_P1';

  const publicRounds: Question[] = state.rounds.map((round, idx) => {
    const isCurrent = idx === state.currentRoundIdx;
    const showAll = isHost || state.phase === 'GAME_END';
    if (showAll) return round;
    return {
      prompt: isCurrent ? round.prompt : '',
      answers: round.answers.map((a) => ({
        text: a.revealed ? a.text : '',
        points: a.revealed ? a.points : 0,
        revealed: a.revealed,
      })),
    };
  });

  const fastMoney = { ...state.fastMoney };
  if (!isHost) {
    fastMoney.p1Responses = state.fastMoney.p1Responses.map((r, i) => {
      if (state.phase === 'FAST_MONEY_REVEAL') {
        return i <= state.fastMoney.revealedIdx ? r : null;
      }
      if (state.phase === 'GAME_END') return r;
      return null;
    });
  }

  let p2ResponsesPublic = state.fastMoney.p2Responses;
  if (!isHost) {
    p2ResponsesPublic = state.fastMoney.p2Responses.map((r, i) => {
      if (state.phase === 'FAST_MONEY_REVEAL') {
        const offset = state.fastMoney.questions.length;
        return i + offset <= state.fastMoney.revealedIdx ? r : null;
      }
      if (state.phase === 'GAME_END') return r;
      return null;
    });
  }

  const publicState = {
    ...state,
    rounds: publicRounds,
    fastMoney: {
      ...fastMoney,
      p1Responses: fastMoney.p1Responses,
      p2Responses: p2ResponsesPublic,
    },
  };

  if (isP2DuringP1) {
    publicState.fastMoney = {
      ...publicState.fastMoney,
      p1Responses: publicState.fastMoney.p1Responses.map(() => null),
    };
  }

  const result: PerspectiveState = {
    perspective,
    selfId,
    publicState,
  };

  if (isHost) {
    result.hostView = {
      rounds: state.rounds,
      pendingFastMoneyAnswer,
      p2Responses: state.fastMoney.p2Responses,
    };
  }

  return result;
}
