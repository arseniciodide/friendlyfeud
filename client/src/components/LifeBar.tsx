export function LifeBar({ strikes }: { strikes: 0 | 1 | 2 }) {
  return (
    <div className="flex gap-1">
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`w-10 h-10 md:w-12 md:h-12 rounded border-2 flex items-center justify-center font-display text-3xl
            ${i < strikes ? 'bg-feud-xred border-red-300 text-white' : 'bg-blue-950 border-blue-700 text-transparent'}
          `}
        >
          X
        </div>
      ))}
    </div>
  );
}
