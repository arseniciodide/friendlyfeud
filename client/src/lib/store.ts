import { create } from 'zustand';
import type { PerspectiveState } from '@ff/shared';

export type LocalRoute =
  | { name: 'splash' }
  | { name: 'host-setup' }
  | { name: 'join' }
  | { name: 'team-select' }
  | { name: 'in-game' };

type Store = {
  route: LocalRoute;
  setRoute: (route: LocalRoute) => void;
  state: PerspectiveState | null;
  setState: (s: PerspectiveState) => void;
  errors: string[];
  pushError: (msg: string) => void;
  clearError: (idx: number) => void;
  hostToken: string | null;
  setHostToken: (t: string | null) => void;
  roomCode: string | null;
  setRoomCode: (c: string | null) => void;
  playerId: string | null;
  setPlayerId: (id: string | null) => void;
  fastMoneyRemainingMs: number | null;
  setFastMoneyRemainingMs: (ms: number | null) => void;
};

export const useStore = create<Store>((set) => ({
  route: { name: 'splash' },
  setRoute: (route) => set({ route }),
  state: null,
  setState: (state) => set({ state }),
  errors: [],
  pushError: (msg) => set((s) => ({ errors: [...s.errors, msg] })),
  clearError: (idx) => set((s) => ({ errors: s.errors.filter((_, i) => i !== idx) })),
  hostToken: localStorage.getItem('ff:hostToken'),
  setHostToken: (t) => {
    if (t) localStorage.setItem('ff:hostToken', t);
    else localStorage.removeItem('ff:hostToken');
    set({ hostToken: t });
  },
  roomCode: localStorage.getItem('ff:roomCode'),
  setRoomCode: (c) => {
    if (c) localStorage.setItem('ff:roomCode', c);
    else localStorage.removeItem('ff:roomCode');
    set({ roomCode: c });
  },
  playerId: localStorage.getItem('ff:playerId'),
  setPlayerId: (id) => {
    if (id) localStorage.setItem('ff:playerId', id);
    else localStorage.removeItem('ff:playerId');
    set({ playerId: id });
  },
  fastMoneyRemainingMs: null,
  setFastMoneyRemainingMs: (ms) => set({ fastMoneyRemainingMs: ms }),
}));
