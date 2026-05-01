import { useEffect } from 'react';
import { useStore } from './lib/store';
import { getSocket } from './lib/socket';
import { Splash } from './screens/Splash';
import { HostSetup } from './screens/HostSetup';
import { JoinRoom } from './screens/JoinRoom';
import { TeamSelect } from './screens/TeamSelect';
import { Lobby } from './screens/Lobby';
import { HostBoard } from './screens/HostBoard';
import { PlayerBoard } from './screens/PlayerBoard';
import { FastMoneyHost } from './screens/FastMoneyHost';
import { FastMoneyPlayer } from './screens/FastMoneyPlayer';
import { GameEnd } from './screens/GameEnd';

export function App() {
  const { route, state, setState, pushError, errors, clearError, setFastMoneyRemainingMs } =
    useStore();

  useEffect(() => {
    const socket = getSocket();
    const onState = (s: Parameters<typeof setState>[0]) => setState(s);
    const onError = (payload: { message: string }) => pushError(payload.message);
    const onTick = (payload: { remainingMs: number }) =>
      setFastMoneyRemainingMs(payload.remainingMs);
    socket.on('room:state', onState);
    socket.on('room:error', onError);
    socket.on('fastmoney:tick', onTick);
    return () => {
      socket.off('room:state', onState);
      socket.off('room:error', onError);
      socket.off('fastmoney:tick', onTick);
    };
  }, [setState, pushError, setFastMoneyRemainingMs]);

  return (
    <div className="min-h-screen w-full">
      <ErrorToasts errors={errors} onDismiss={clearError} />
      <Router route={route} hasState={!!state} />
    </div>
  );
}

function ErrorToasts({ errors, onDismiss }: { errors: string[]; onDismiss: (i: number) => void }) {
  if (errors.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {errors.map((e, i) => (
        <div
          key={i}
          className="bg-feud-xred text-white px-4 py-2 rounded-md shadow-lg cursor-pointer max-w-sm"
          onClick={() => onDismiss(i)}
        >
          {e}
        </div>
      ))}
    </div>
  );
}

function Router({ route, hasState }: { route: { name: string }; hasState: boolean }) {
  const state = useStore((s) => s.state);

  if (route.name === 'splash') return <Splash />;
  if (route.name === 'host-setup') return <HostSetup />;
  if (route.name === 'join') return <JoinRoom />;
  if (!hasState || !state) return <Splash />;

  if (state.perspective === 'host') {
    const phase = state.publicState.phase;
    if (phase === 'LOBBY') return <Lobby />;
    if (phase === 'ROUND_ACTIVE' || phase === 'ROUND_STEAL' || phase === 'ROUND_RESOLVED')
      return <HostBoard />;
    if (
      phase === 'FAST_MONEY_SETUP' ||
      phase === 'FAST_MONEY_P1' ||
      phase === 'FAST_MONEY_P1_DONE' ||
      phase === 'FAST_MONEY_P2' ||
      phase === 'FAST_MONEY_REVEAL'
    )
      return <FastMoneyHost />;
    if (phase === 'GAME_END') return <GameEnd />;
  }

  if (state.perspective === 'player') {
    const player = state.publicState.players.find((p) => p.id === state.selfId);
    if (!player) return <Splash />;
    const phase = state.publicState.phase;
    if (phase === 'LOBBY') {
      if (!player.teamId) return <TeamSelect />;
      return <Lobby />;
    }
    if (
      phase === 'FAST_MONEY_SETUP' ||
      phase === 'FAST_MONEY_P1' ||
      phase === 'FAST_MONEY_P1_DONE' ||
      phase === 'FAST_MONEY_P2' ||
      phase === 'FAST_MONEY_REVEAL'
    )
      return <FastMoneyPlayer />;
    if (phase === 'GAME_END') return <GameEnd />;
    return <PlayerBoard />;
  }

  return <Splash />;
}
