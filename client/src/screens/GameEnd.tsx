import { useStore } from '../lib/store';

export function GameEnd() {
  const state = useStore((s) => s.state);
  if (!state) return null;
  const t = state.publicState.teams;
  const winnerId = t[1].score > t[2].score ? 1 : t[2].score > t[1].score ? 2 : null;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-6xl font-display text-feud-accent">GAME OVER</h1>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="text-xl">{t[1].familyName || 'Team 1'}</div>
          <div className="text-7xl font-display">{t[1].score}</div>
        </div>
        <div>
          <div className="text-xl">{t[2].familyName || 'Team 2'}</div>
          <div className="text-7xl font-display">{t[2].score}</div>
        </div>
      </div>
      {winnerId ? (
        <div className="text-4xl font-display text-feud-good">
          🏆 {t[winnerId].familyName || `Team ${winnerId}`} WINS
        </div>
      ) : (
        <div className="text-3xl">It's a tie!</div>
      )}
    </div>
  );
}
