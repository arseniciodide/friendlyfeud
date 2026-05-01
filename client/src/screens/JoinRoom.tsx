import { useState } from 'react';
import { useStore } from '../lib/store';
import { getSocket } from '../lib/socket';

export function JoinRoom() {
  const { setRoute, setRoomCode, setPlayerId, playerId } = useStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function join() {
    setError(null);
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    if (!trimmedCode || !trimmedName) {
      setError('Enter a room code and your name.');
      return;
    }
    const socket = getSocket();
    socket.emit(
      'player:join',
      { roomCode: trimmedCode, name: trimmedName, playerId: playerId ?? undefined },
      (res) => {
        if (res.ok) {
          setRoomCode(trimmedCode);
          setPlayerId(res.playerId);
        } else {
          setError(res.error);
        }
      },
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <h2 className="text-4xl font-display text-feud-accent">Join a game</h2>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <input
          className="input text-2xl text-center tracking-widest uppercase"
          placeholder="ROOM"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <input
          className="input"
          placeholder="Your name / gamer tag"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
        />
        {error && <div className="text-feud-xred">{error}</div>}
        <button onClick={join} className="btn-primary text-xl">
          Join
        </button>
        <button onClick={() => setRoute({ name: 'splash' })} className="btn-secondary">
          Back
        </button>
      </div>
    </div>
  );
}
