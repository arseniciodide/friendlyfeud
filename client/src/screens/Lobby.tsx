import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import type { TeamId } from '@ff/shared';

export function Lobby() {
  const state = useStore((s) => s.state);
  if (!state) return null;
  const isHost = state.perspective === 'host';
  const t1Players = state.publicState.players.filter((p) => p.teamId === 1);
  const t2Players = state.publicState.players.filter((p) => p.teamId === 2);
  const unassigned = state.publicState.players.filter((p) => !p.teamId);
  const canStart = t1Players.length > 0 && t2Players.length > 0 && state.publicState.rounds.length > 0;

  function startGame() {
    getSocket().emit('host:startGame');
  }

  return (
    <div className="min-h-screen p-6 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <h2 className="text-3xl font-display text-feud-accent">Lobby</h2>
        <div className="text-right">
          <div className="text-blue-300 text-sm">Room code</div>
          <div className="text-4xl font-display tracking-widest">{state.publicState.roomCode}</div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamPanel teamId={1} familyName={state.publicState.teams[1].familyName} players={t1Players} />
        <TeamPanel teamId={2} familyName={state.publicState.teams[2].familyName} players={t2Players} />
      </div>

      {unassigned.length > 0 && (
        <div className="panel">
          <div className="text-sm text-blue-200 mb-2">Waiting to pick a team</div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p) => (
              <span key={p.id} className="bg-blue-950 px-3 py-1 rounded">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {isHost && (
        <div className="flex justify-end">
          <button onClick={startGame} className="btn-primary text-xl" disabled={!canStart}>
            {canStart
              ? 'Start game'
              : state.publicState.rounds.length === 0
              ? 'Save questions first'
              : 'Need at least 1 player on each team'}
          </button>
        </div>
      )}

      {!isHost && (
        <div className="text-center text-blue-200 text-lg">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  );
}

function TeamPanel({
  teamId,
  familyName,
  players,
}: {
  teamId: TeamId;
  familyName: string;
  players: { id: string; name: string; connected: boolean }[];
}) {
  return (
    <div className="panel">
      <div className="text-sm text-blue-300">Team {teamId}</div>
      <div className="text-3xl font-display text-feud-accent mb-3">
        {familyName || <span className="opacity-50">Unnamed</span>}
      </div>
      <ul className="space-y-1">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                p.connected ? 'bg-feud-good' : 'bg-gray-500'
              }`}
            />
            {p.name}
          </li>
        ))}
        {players.length === 0 && <li className="text-blue-300 italic">No players yet</li>}
      </ul>
    </div>
  );
}
