import type { Team } from '@ff/shared';
import { LifeBar } from './LifeBar';

export function Scoreboard({
  teams,
  controllingTeamId,
  stealingTeamId,
  pendingPoints,
}: {
  teams: { 1: Team; 2: Team };
  controllingTeamId: 1 | 2 | null;
  stealingTeamId: 1 | 2 | null;
  pendingPoints: number;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-4 w-full max-w-3xl">
      <TeamScore team={teams[1]} active={controllingTeamId === 1 || stealingTeamId === 1} />
      <div className="text-center">
        <div className="text-blue-200 text-sm">Pot</div>
        <div className="text-4xl font-display text-feud-accent">{pendingPoints}</div>
      </div>
      <TeamScore team={teams[2]} active={controllingTeamId === 2 || stealingTeamId === 2} alignRight />
    </div>
  );
}

function TeamScore({ team, active, alignRight }: { team: Team; active: boolean; alignRight?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${alignRight ? 'items-end' : 'items-start'}`}>
      <div className={`font-display text-xl ${active ? 'text-feud-accent' : 'text-white'}`}>
        {team.familyName || `Team ${team.id}`}
      </div>
      <div className="text-5xl md:text-6xl font-display">{team.score}</div>
      <LifeBar strikes={team.strikes} />
    </div>
  );
}
