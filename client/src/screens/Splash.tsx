import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';

export function Splash() {
  const { setRoute, setHostToken, setRoomCode } = useStore();

  function hostGame() {
    const socket = getSocket();
    socket.emit('host:create', (res) => {
      if (res.ok) {
        setHostToken(res.hostToken);
        setRoomCode(res.roomCode);
        setRoute({ name: 'host-setup' });
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-12 px-4">
      <h1 className="text-6xl md:text-8xl font-display tracking-wide text-feud-accent text-center">
        FriendlyFeud
      </h1>
      <p className="text-xl text-blue-200">Friends against friends.</p>
      <div className="flex flex-col md:flex-row gap-6">
        <button onClick={hostGame} className="btn-primary text-2xl px-10 py-4">
          Host a game
        </button>
        <button
          onClick={() => setRoute({ name: 'join' })}
          className="btn-secondary text-2xl px-10 py-4"
        >
          Join with code
        </button>
      </div>
    </div>
  );
}
