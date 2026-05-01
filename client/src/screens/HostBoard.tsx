import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';
import { Board8 } from '../components/Board8';
import { Scoreboard } from '../components/Scoreboard';
import { PlayerList } from '../components/PlayerList';

export function HostBoard() {
  const state = useStore((s) => s.state);
  if (!state || state.perspective !== 'host' || !state.hostView) return null;

  const ps = state.publicState;
  const hostRound = state.hostView.rounds[ps.currentRoundIdx];
  const publicRound = ps.rounds[ps.currentRoundIdx];
  if (!hostRound || !publicRound) return null;

  const t1Players = ps.players.filter((p) => p.teamId === 1);
  const t2Players = ps.players.filter((p) => p.teamId === 2);

  function reveal(idx: number) {
    getSocket().emit('host:revealBox', { answerIdx: idx });
  }
  function deny() {
    getSocket().emit('host:denyAnswer');
  }
  function steal(success: boolean) {
    getSocket().emit('host:resolveSteal', { stealSucceeded: success });
  }
  function next() {
    getSocket().emit('host:nextRound');
  }

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center gap-4">
      <header className="w-full max-w-3xl flex justify-between items-center text-sm">
        <div>
          <div className="text-blue-300">Room {ps.roomCode}</div>
          <div className="text-blue-200">
            Round {ps.currentRoundIdx + 1} / {ps.rounds.length}
          </div>
        </div>
        <div className="text-right text-feud-accent font-display text-xl">HOST VIEW</div>
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
        {hostRound.prompt || <span className="opacity-50">(no prompt)</span>}
      </div>

      <Board8
        publicAnswers={publicRound.answers}
        hostAnswers={hostRound.answers}
        onClickBox={reveal}
      />

      <div className="text-sm text-blue-200">
        Click an answer box above to reveal it (faded text shows you what's hidden).
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {ps.phase === 'ROUND_ACTIVE' && (
          <>
            <button onClick={deny} className="btn-danger text-lg">
              Deny — strike X
            </button>
          </>
        )}
        {ps.phase === 'ROUND_STEAL' && (
          <>
            <button onClick={() => steal(true)} className="btn-good text-lg">
              Steal succeeded
            </button>
            <button onClick={() => steal(false)} className="btn-danger text-lg">
              Steal failed
            </button>
          </>
        )}
        {ps.phase === 'ROUND_RESOLVED' && (
          <button onClick={next} className="btn-primary text-xl">
            {ps.currentRoundIdx + 1 >= ps.rounds.length ? 'Continue to Fast Money →' : 'Next round →'}
          </button>
        )}
      </div>

      {ps.phase === 'ROUND_STEAL' && (
        <div className="text-feud-accent text-center max-w-xl">
          Steal: {ps.teams[ps.stealingTeamId!].familyName} gets ONE guess. If correct → reveal the box
          (they win the pot). If wrong → click "Steal failed" to give the pot to{' '}
          {ps.teams[ps.controllingTeamId!].familyName}.
        </div>
      )}
    </div>
  );
}
