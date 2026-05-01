import { useState } from 'react';
import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import type { TeamId } from '@ff/shared';

export function TeamSelect() {
  const state = useStore((s) => s.state);
  const selfId = state?.selfId;
  if (!state) return null;

  const teams = state.publicState.teams;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <div className="text-blue-300 text-sm">Room</div>
        <div className="text-4xl font-display text-feud-accent tracking-widest">
          {state.publicState.roomCode}
        </div>
      </div>
      <h2 className="text-3xl font-display">Pick your team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        <TeamCard teamId={1} familyName={teams[1].familyName} />
        <TeamCard teamId={2} familyName={teams[2].familyName} />
      </div>
      <div className="text-blue-200 text-sm">Logged in as {findSelfName(state, selfId)}</div>
    </div>
  );
}

function findSelfName(
  state: NonNullable<ReturnType<typeof useStore.getState>['state']>,
  selfId: string | null | undefined,
): string {
  return state.publicState.players.find((p) => p.id === selfId)?.name ?? '';
}

function TeamCard({ teamId, familyName }: { teamId: TeamId; familyName: string }) {
  const [name, setName] = useState('');
  const needsName = !familyName;
  function pick() {
    const socket = getSocket();
    socket.emit('player:pickTeam', {
      teamId,
      familyName: needsName ? name.trim() || undefined : undefined,
    });
  }
  return (
    <div className="panel flex flex-col gap-4">
      <div className="text-2xl font-display">Team {teamId}</div>
      {needsName ? (
        <>
          <div className="text-blue-200 text-sm">Be the first to name this family.</div>
          <input
            className="input"
            placeholder="Family name (e.g. The Smiths)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
          />
        </>
      ) : (
        <div className="text-3xl text-feud-accent font-display">{familyName}</div>
      )}
      <button onClick={pick} className="btn-primary">
        Join this team
      </button>
    </div>
  );
}
