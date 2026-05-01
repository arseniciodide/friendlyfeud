import type { Player, Team, TeamId } from '@ff/shared';

export function PlayerList({
  teamId,
  team,
  players,
  active,
  alignRight,
}: {
  teamId: TeamId;
  team: Team;
  players: Player[];
  active: boolean;
  alignRight?: boolean;
}) {
  const currentPlayer = active ? players[team.turnIndex % Math.max(1, players.length)] : null;
  return (
    <div className={`flex flex-col gap-1 ${alignRight ? 'items-end' : 'items-start'}`}>
      <div className="text-blue-300 text-xs">Team {teamId}</div>
      <ul className={`flex flex-wrap gap-1 ${alignRight ? 'justify-end' : ''}`}>
        {players.map((p) => (
          <li
            key={p.id}
            className={`px-2 py-1 rounded text-sm transition-colors ${
              currentPlayer?.id === p.id
                ? 'bg-feud-accent text-feud-board font-bold'
                : 'bg-blue-950 text-white'
            } ${p.connected ? '' : 'opacity-40'}`}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
