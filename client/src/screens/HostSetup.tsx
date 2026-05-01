import { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import {
  BOARD_SIZE,
  FAST_MONEY_QUESTION_COUNT,
  emptyFastMoneyQuestion,
  emptyQuestion,
  type FastMoneyQuestion,
  type Question,
} from '@ff/shared';

const STORAGE_KEY = 'ff:questionPack';

type Pack = { rounds: Question[]; fastMoney: FastMoneyQuestion[] };

function loadPack(): Pack | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePack(pack: Pack): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pack));
}

export function HostSetup() {
  const { state, roomCode, setRoute } = useStore();
  const [rounds, setRounds] = useState<Question[]>([emptyQuestion()]);
  const [fastMoney, setFastMoney] = useState<FastMoneyQuestion[]>(() =>
    Array.from({ length: FAST_MONEY_QUESTION_COUNT }, emptyFastMoneyQuestion),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const pack = loadPack();
    if (pack) {
      if (pack.rounds?.length) setRounds(pack.rounds);
      if (pack.fastMoney?.length) setFastMoney(pack.fastMoney);
    }
  }, []);

  const numPlayers = state?.publicState.players.length ?? 0;

  function setRoundCount(n: number) {
    const target = Math.max(1, Math.min(20, n));
    setRounds((prev) => {
      if (target <= prev.length) return prev.slice(0, target);
      const out = [...prev];
      while (out.length < target) out.push(emptyQuestion());
      return out;
    });
  }

  function updateRound(idx: number, fn: (r: Question) => Question) {
    setRounds((prev) => prev.map((r, i) => (i === idx ? fn(r) : r)));
  }

  function publish() {
    getSocket().emit('host:saveQuestions', { rounds, fastMoneyQuestions: fastMoney });
    setRoute({ name: 'in-game' });
  }

  function saveLocally() {
    savePack({ rounds, fastMoney });
    setSavedAt(new Date().toLocaleTimeString());
  }

  function loadLocally() {
    const pack = loadPack();
    if (pack) {
      setRounds(pack.rounds);
      setFastMoney(pack.fastMoney);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ rounds, fastMoney }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'friendlyfeud-questions.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const pack = JSON.parse(String(reader.result)) as Pack;
        if (Array.isArray(pack.rounds)) setRounds(pack.rounds);
        if (Array.isArray(pack.fastMoney)) setFastMoney(pack.fastMoney);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-display text-feud-accent">Host setup</h2>
          <div className="text-blue-200">
            Room code: <span className="font-mono text-2xl text-white">{roomCode}</span>
            <span className="ml-3 text-sm">
              Share this code with players. ({numPlayers} joined)
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={saveLocally} className="btn-secondary">
            Save pack
          </button>
          <button onClick={loadLocally} className="btn-secondary">
            Load pack
          </button>
          <button onClick={exportJson} className="btn-secondary">
            Export JSON
          </button>
          <label className="btn-secondary cursor-pointer">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
            />
          </label>
        </div>
      </header>
      {savedAt && <div className="text-sm text-feud-good">Saved at {savedAt}</div>}

      <div className="panel">
        <label className="block text-sm text-blue-200 mb-2">Number of rounds</label>
        <input
          type="number"
          min={1}
          max={20}
          value={rounds.length}
          onChange={(e) => setRoundCount(parseInt(e.target.value || '1', 10))}
          className="input w-32"
        />
      </div>

      <div className="space-y-4">
        {rounds.map((round, idx) => (
          <RoundEditor key={idx} idx={idx} round={round} onChange={(fn) => updateRound(idx, fn)} />
        ))}
      </div>

      <div className="panel space-y-3">
        <h3 className="text-2xl font-display text-feud-accent">Fast Money — 5 questions</h3>
        <p className="text-sm text-blue-200">
          You'll score answers live. No need to pre-enter answer text.
        </p>
        {fastMoney.map((q, i) => (
          <input
            key={i}
            className="input w-full"
            placeholder={`Question ${i + 1}`}
            value={q.prompt}
            onChange={(e) => {
              const v = e.target.value;
              setFastMoney((prev) => prev.map((p, j) => (j === i ? { prompt: v } : p)));
            }}
          />
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={publish} className="btn-primary text-xl">
          Save & open lobby
        </button>
      </div>
    </div>
  );
}

function RoundEditor({
  idx,
  round,
  onChange,
}: {
  idx: number;
  round: Question;
  onChange: (fn: (r: Question) => Question) => void;
}) {
  return (
    <div className="panel space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display">Round {idx + 1}</h3>
      </div>
      <textarea
        className="input w-full"
        placeholder="Question prompt"
        value={round.prompt}
        rows={2}
        onChange={(e) => {
          const v = e.target.value;
          onChange((r) => ({ ...r, prompt: v }));
        }}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Array.from({ length: BOARD_SIZE }).map((_, i) => {
          const a = round.answers[i] ?? { text: '', points: 0, revealed: false };
          return (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-blue-300 w-6 text-right">{i + 1}.</span>
              <input
                className="input flex-1"
                placeholder={`Answer ${i + 1} (leave blank for empty box)`}
                value={a.text}
                onChange={(e) => {
                  const text = e.target.value;
                  onChange((r) => ({
                    ...r,
                    answers: r.answers.map((aa, j) => (j === i ? { ...aa, text } : aa)),
                  }));
                }}
              />
              <input
                className="input w-20"
                type="number"
                min={0}
                max={999}
                placeholder="pts"
                value={a.points || ''}
                onChange={(e) => {
                  const points = parseInt(e.target.value || '0', 10);
                  onChange((r) => ({
                    ...r,
                    answers: r.answers.map((aa, j) => (j === i ? { ...aa, points } : aa)),
                  }));
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
