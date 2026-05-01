import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import { FAST_MONEY_QUESTION_COUNT, type FastMoneyResponse } from '@ff/shared';

export function FastMoneyPlayer() {
  const state = useStore((s) => s.state);
  const remaining = useStore((s) => s.fastMoneyRemainingMs);
  if (!state) return null;
  const ps = state.publicState;
  const fm = ps.fastMoney;
  const selfId = state.selfId;
  const phase = ps.phase;

  const isP1 = selfId === fm.p1Id;
  const isP2 = selfId === fm.p2Id;
  const isFmPlayer = isP1 || isP2;

  if (phase === 'FAST_MONEY_SETUP') {
    return (
      <Centered>
        <h2 className="text-3xl font-display text-feud-accent">Fast Money</h2>
        <p>Host is picking the two players...</p>
      </Centered>
    );
  }

  if (isP2 && phase === 'FAST_MONEY_P1') {
    return (
      <Centered>
        <h2 className="text-5xl font-display text-feud-xred">COVER YOUR EARS</h2>
        <p className="text-2xl text-blue-200">
          Player 1 is answering. Leave the room or look away — your screen is hidden until it's your
          turn.
        </p>
      </Centered>
    );
  }

  if (isFmPlayer && (phase === 'FAST_MONEY_P1' || phase === 'FAST_MONEY_P2')) {
    return <PlayerInput player={isP1 ? 1 : 2} remainingMs={remaining} />;
  }

  if (phase === 'FAST_MONEY_REVEAL') {
    return <RevealView />;
  }

  return (
    <Centered>
      <h2 className="text-3xl font-display text-feud-accent">Fast Money</h2>
      <p className="text-blue-200">Watching from the sidelines.</p>
      <RevealView />
    </Centered>
  );
}

function PlayerInput({ player, remainingMs }: { player: 1 | 2; remainingMs: number | null }) {
  const state = useStore((s) => s.state)!;
  const fm = state.publicState.fastMoney;
  const responses = player === 1 ? fm.p1Responses : fm.p2Responses;
  const [drafts, setDrafts] = useState<string[]>(() =>
    Array.from({ length: FAST_MONEY_QUESTION_COUNT }, (_, i) => responses[i]?.text ?? ''),
  );

  function submit(idx: number) {
    getSocket().emit('player:submitFastMoneyAnswer', { qIdx: idx, text: drafts[idx] });
  }

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-display text-feud-accent">Fast Money — your turn</h2>
        {remainingMs !== null && (
          <div className="text-5xl font-display text-feud-accent">
            {(remainingMs / 1000).toFixed(1)}s
          </div>
        )}
      </header>
      <p className="text-blue-200 text-sm">
        Submit each answer. The host will score it. Empty + Submit = pass.
      </p>
      {fm.questions.map((q, i) => (
        <div key={i} className="panel space-y-2">
          <div className="font-display text-lg">{q.prompt}</div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Your answer..."
              value={drafts[i]}
              onChange={(e) => {
                const v = e.target.value;
                setDrafts((prev) => prev.map((d, j) => (j === i ? v : d)));
              }}
              onKeyDown={(e) => e.key === 'Enter' && submit(i)}
            />
            <button onClick={() => submit(i)} className="btn-primary">
              Submit
            </button>
          </div>
          {responses[i] && (
            <div className="text-sm text-feud-good">
              Sent — host marked: {responses[i]?.duplicate ? 'DUPLICATE' : `${responses[i]?.points} pts`}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RevealView() {
  const state = useStore((s) => s.state)!;
  const fm = state.publicState.fastMoney;
  const allResponses: (FastMoneyResponse | null)[] = [...fm.p1Responses, ...fm.p2Responses];
  const total = allResponses.reduce((a, r) => a + (r && !r.duplicate ? r.points : 0), 0);
  const target = fm.targetScore;

  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto flex flex-col gap-4 items-center">
      <h2 className="text-3xl font-display text-feud-accent">Fast Money — Reveal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <RevealColumn title="Player 1" responses={fm.p1Responses} questions={fm.questions} />
        <RevealColumn title="Player 2" responses={fm.p2Responses} questions={fm.questions} />
      </div>
      <div className="text-4xl font-display">
        Total: <span className="text-feud-accent">{total}</span> / {target}
      </div>
      {state.publicState.phase === 'GAME_END' && total >= target && (
        <div className="text-3xl font-display text-feud-good">🏆 BONUS WIN!</div>
      )}
      {state.publicState.phase === 'GAME_END' && total < target && (
        <div className="text-2xl font-display text-feud-xred">
          Came up short — better luck next time.
        </div>
      )}
    </div>
  );
}

function RevealColumn({
  title,
  responses,
  questions,
}: {
  title: string;
  responses: (FastMoneyResponse | null)[];
  questions: { prompt: string }[];
}) {
  return (
    <div className="panel">
      <div className="text-blue-300 text-sm mb-2">{title}</div>
      <ul className="space-y-2">
        {responses.map((r, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="opacity-70 text-sm flex-1 truncate">{questions[i]?.prompt}</span>
            <span className="font-display">
              {r === null ? (
                <span className="opacity-50">—</span>
              ) : r.duplicate ? (
                <span className="text-feud-xred">DUP</span>
              ) : (
                <span className="text-feud-accent">{r.points}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-4 p-6">
      {children}
    </div>
  );
}
