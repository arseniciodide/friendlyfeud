import { useStore } from '../lib/store';
import { Board8 } from '../components/Board8';
import { Scoreboard } from '../components/Scoreboard';
import { PlayerList } from '../components/PlayerList';

export function PlayerBoard() {
  const state = useStore((s) => s.state);
  if (!state) return null;
  const ps = state.publicState;
  const round = ps.rounds[ps.currentRoundIdx];
  if (!round) return null;

  const t1Players = ps.players.filter((p) => p.teamId === 1);
  const t2Players = ps.players.filter((p) => p.teamId === 2);
  const self = ps.players.find((p) => p.id === state.selfId);

  const yourTeamActive =
    (ps.phase === 'ROUND_ACTIVE' && ps.controllingTeamId === self?.teamId) ||
    (ps.phase === 'ROUND_STEAL' && ps.stealingTeamId === self?.teamId);

  const activePlayers =
    ps.phase === 'ROUND_STEAL' && ps.stealingTeamId
      ? ps.players.filter((p) => p.teamId === ps.stealingTeamId)
      : ps.controllingTeamId
      ? ps.players.filter((p) => p.teamId === ps.controllingTeamId)
      : [];
  const activeTeamId =
    ps.phase === 'ROUND_STEAL' ? ps.stealingTeamId : ps.controllingTeamId;
  const turnIndex = activeTeamId ? ps.teams[activeTeamId].turnIndex : 0;
  const currentPlayer = activePlayers[turnIndex % Math.max(1, activePlayers.length)];
  const isYourTurn = currentPlayer?.id === state.selfId;

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center gap-4">
      <header className="w-full max-w-3xl flex justify-between items-center text-sm">
        <div>
          <div className="text-blue-300">Room {ps.roomCode}</div>
          <div className="text-blue-200">
            Round {ps.currentRoundIdx + 1} / {ps.rounds.length}
          </div>
        </div>
        {self && (
          <div className="text-right">
            <div className="text-blue-300">You</div>
            <div className="font-display text-lg">{self.name}</div>
          </div>
        )}
      </header>

      <Scoreboard
        teams={ps.teams}
        controllingTeamId={ps.controllingTeamId}
        stealingTeamId={ps.stealingTeamId}
        pendingPoints={ps.pendingPoints}
      />

      <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
        <PlayerList
          teamId={1}
          team={ps.teams[1]}
          players={t1Players}
          active={
            (ps.phase === 'ROUND_ACTIVE' && ps.controllingTeamId === 1) ||
            (ps.phase === 'ROUND_STEAL' && ps.stealingTeamId === 1)
          }
        />
        <PlayerList
          teamId={2}
          team={ps.teams[2]}
          players={t2Players}
          active={
            (ps.phase === 'ROUND_ACTIVE' && ps.controllingTeamId === 2) ||
            (ps.phase === 'ROUND_STEAL' && ps.stealingTeamId === 2)
          }
          alignRight
        />
      </div>

      <div className="text-2xl md:text-3xl font-display text-center max-w-3xl">
        {round.prompt || <span className="opacity-50">Waiting...</span>}
      </div>

      <Board8 publicAnswers={round.answers} />

      {isYourTurn && (
        <div className="bg-feud-accent text-feud-board px-6 py-3 rounded-lg font-display text-2xl animate-pulse">
          IT'S YOUR TURN — give your answer out loud!
        </div>
      )}
      {!isYourTurn && yourTeamActive && currentPlayer && (
        <div className="text-feud-accent text-lg">
          {currentPlayer.name} is up — wait your turn.
        </div>
      )}
      {!yourTeamActive && currentPlayer && (
        <div className="text-blue-200">
          {currentPlayer.name} ({ps.teams[activeTeamId!].familyName}) is guessing...
        </div>
      )}
      {ps.phase === 'ROUND_RESOLVED' && (
        <div className="text-feud-accent text-xl">Round over — waiting for the host...</div>
      )}
    </div>
  );
}
