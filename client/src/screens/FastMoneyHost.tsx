import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import {
  FAST_MONEY_QUESTION_COUNT,
  type FastMoneyResponse,
  type Player,
} from '@ff/shared';

export function FastMoneyHost() {
  const state = useStore((s) => s.state);
  const remaining = useStore((s) => s.fastMoneyRemainingMs);
  if (!state || state.perspective !== 'host' || !state.hostView) return null;
  const ps = state.publicState;
  const fm = ps.fastMoney;
  const phase = ps.phase;

  if (phase === 'FAST_MONEY_SETUP') return <Setup state={state} />;

  const currentPlayer: 1 | 2 = phase === 'FAST_MONEY_P2' || phase === 'FAST_MONEY_P1_DONE' ? 2 : 1;
  const responses =
    currentPlayer === 1 ? fm.p1Responses : state.hostView.p2Responses;
  const otherResponses = currentPlayer === 1 ? state.hostView.p2Responses : fm.p1Responses;
  const playerName = playerNameById(
    ps.players,
    currentPlayer === 1 ? fm.p1Id : fm.p2Id,
  );
  const pending = state.hostView.pendingFastMoneyAnswer;

  function startP2() {
    getSocket().emit('host:startFastMoneyP2');
  }
  function revealNext() {
    getSocket().emit('host:revealFastMoneyNext');
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-4xl mx-auto flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-display text-feud-accent">Fast Money</h2>
        <div className="text-right">
          <div className="text-blue-300 text-sm">Player {currentPlayer}</div>
          <div className="font-display text-xl">{playerName}</div>
          {remaining !== null && (phase === 'FAST_MONEY_P1' || phase === 'FAST_MONEY_P2') && (
            <div className="text-4xl font-display text-feud-accent">
              {(remaining / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      </header>

      {phase === 'FAST_MONEY_P1_DONE' && (
        <div className="panel">
          <p className="mb-2">Player 1 done. Bring Player 2 back into the room when ready.</p>
          <button onClick={startP2} className="btn-primary text-lg">
            Start Player 2 (25s)
          </button>
        </div>
      )}

      {(phase === 'FAST_MONEY_P1' ||
        phase === 'FAST_MONEY_P2' ||
        phase === 'FAST_MONEY_REVEAL') && (
        <div className="space-y-2">
          {fm.questions.map((q, i) => (
            <FastMoneyRow
              key={i}
              idx={i}
              prompt={q.prompt}
              response={responses[i]}
              otherResponse={otherResponses[i]}
              currentPlayer={currentPlayer}
              pending={pending && pending.qIdx === i && pending.player === currentPlayer ? pending.text : null}
              disabled={phase === 'FAST_MONEY_REVEAL'}
            />
          ))}
        </div>
      )}

      {phase === 'FAST_MONEY_P1' && (
        <div className="text-blue-200 text-sm">
          Type the player's spoken answer + score them. They can also type into their own screen.
        </div>
      )}

      {phase === 'FAST_MONEY_REVEAL' && (
        <RevealPanel state={state} onReveal={revealNext} />
      )}
    </div>
  );
}

function Setup({ state }: { state: NonNullable<ReturnType<typeof useStore.getState>['state']> }) {
  const ps = state.publicState;
  const t1 = ps.players.filter((p) => p.teamId === 1);
  const t2 = ps.players.filter((p) => p.teamId === 2);
  const [p1Id, setP1Id] = useState<string>(ps.fastMoney.p1Id ?? t1[0]?.id ?? '');
  const [p2Id, setP2Id] = useState<string>(ps.fastMoney.p2Id ?? t2[0]?.id ?? '');

  function assign() {
    if (!p1Id || !p2Id) return;
    getSocket().emit('host:assignFastMoneyPlayers', { p1Id, p2Id });
  }
  function start() {
    assign();
    getSocket().emit('host:startFastMoneyP1');
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h2 className="text-3xl font-display text-feud-accent">Fast Money — Setup</h2>
      <p className="text-blue-200">
        Pick one player from each team. Player 1 goes first (20s). Player 2 should leave the room or
        cover their ears — their screen will be blanked automatically.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerPicker label="Player 1" players={t1} value={p1Id} onChange={setP1Id} />
        <PlayerPicker label="Player 2" players={t2} value={p2Id} onChange={setP2Id} />
      </div>

      <button
        onClick={start}
        className="btn-primary text-xl self-end"
        disabled={!p1Id || !p2Id || p1Id === p2Id}
      >
        Start Fast Money
      </button>
    </div>
  );
}

function PlayerPicker({
  label,
  players,
  value,
  onChange,
}: {
  label: string;
  players: Player[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="panel">
      <div className="text-sm text-blue-300 mb-2">{label}</div>
      <div className="space-y-1">
        {players.map((p) => (
          <label key={p.id} className="flex items-center gap-2">
            <input
              type="radio"
              checked={value === p.id}
              onChange={() => onChange(p.id)}
            />
            {p.name}
          </label>
        ))}
        {players.length === 0 && <div className="text-blue-300 italic">No players on this team</div>}
      </div>
    </div>
  );
}

function FastMoneyRow({
  idx,
  prompt,
  response,
  otherResponse,
  currentPlayer,
  pending,
  disabled,
}: {
  idx: number;
  prompt: string;
  response: FastMoneyResponse | null;
  otherResponse: FastMoneyResponse | null;
  currentPlayer: 1 | 2;
  pending: string | null;
  disabled: boolean;
}) {
  const [text, setText] = useState(response?.text ?? '');
  const [points, setPoints] = useState<number>(response?.points ?? 0);

  useEffect(() => {
    if (pending !== null) setText(pending);
  }, [pending]);
  useEffect(() => {
    if (response) {
      setText(response.text);
      setPoints(response.points);
    }
  }, [response?.text, response?.points]);

  const isDuplicate =
    currentPlayer === 2 &&
    text.trim().length > 0 &&
    otherResponse &&
    otherResponse.text.trim().toLowerCase() === text.trim().toLowerCase();

  function record(extra?: { duplicate?: boolean }) {
    getSocket().emit('host:recordFastMoneyResponse', {
      player: currentPlayer,
      qIdx: idx,
      text: text.trim(),
      points: extra?.duplicate ? 0 : points,
      duplicate: extra?.duplicate ?? false,
    });
  }

  return (
    <div className={`panel space-y-2 ${pending ? 'ring-2 ring-feud-accent' : ''}`}>
      <div className="text-blue-200 text-sm">Q{idx + 1}</div>
      <div className="font-display text-lg">{prompt || <span className="opacity-50">(empty)</span>}</div>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Player's answer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
        />
        <input
          className="input w-24"
          type="number"
          min={0}
          max={99}
          placeholder="pts"
          value={points || ''}
          onChange={(e) => setPoints(parseInt(e.target.value || '0', 10))}
          disabled={disabled}
        />
        <button onClick={() => record()} className="btn-good" disabled={disabled}>
          Record
        </button>
        {currentPlayer === 2 && (
          <button
            onClick={() => record({ duplicate: true })}
            className="btn-danger"
            disabled={disabled}
          >
            Duplicate (buzz)
          </button>
        )}
      </div>
      {isDuplicate && (
        <div className="text-feud-xred text-sm">
          ⚠ Matches Player 1's answer — use "Duplicate (buzz)".
        </div>
      )}
      {response && (
        <div className="text-feud-good text-sm">
          ✓ Recorded: {response.text || '(pass)'} — {response.duplicate ? 'DUPLICATE' : `${response.points} pts`}
        </div>
      )}
    </div>
  );
}

function RevealPanel({
  state,
  onReveal,
}: {
  state: NonNullable<ReturnType<typeof useStore.getState>['state']>;
  onReveal: () => void;
}) {
  const fm = state.publicState.fastMoney;
  const total =
    fm.p1Responses.reduce((a, r) => a + (r && !r.duplicate ? r.points : 0), 0) +
    fm.p2Responses.reduce((a, r) => a + (r && !r.duplicate ? r.points : 0), 0);
  const target = fm.targetScore;
  return (
    <div className="panel space-y-3">
      <div className="text-2xl font-display">
        Reveal — running total: <span className="text-feud-accent">{total}</span> / {target}
      </div>
      <button onClick={onReveal} className="btn-primary text-lg">
        Reveal next answer
      </button>
    </div>
  );
}

function playerNameById(players: Player[], id: string | null): string {
  if (!id) return '';
  return players.find((p) => p.id === id)?.name ?? '';
}
