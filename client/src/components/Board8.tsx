import { BOARD_SIZE, type Answer } from '@ff/shared';

type Props = {
  publicAnswers: Answer[];
  hostAnswers?: Answer[];
  onClickBox?: (idx: number) => void;
};

export function Board8({ publicAnswers, hostAnswers, onClickBox }: Props) {
  const slots = Array.from({ length: BOARD_SIZE });
  const left = slots.slice(0, 4);
  const right = slots.slice(4);
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-3xl">
      {[left, right].map((column, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-2">
          {column.map((_, rowIdx) => {
            const idx = colIdx * 4 + rowIdx;
            return (
              <BoardBox
                key={idx}
                idx={idx}
                publicAnswer={publicAnswers[idx]}
                hostAnswer={hostAnswers?.[idx]}
                onClick={onClickBox ? () => onClickBox(idx) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function BoardBox({
  idx,
  publicAnswer,
  hostAnswer,
  onClick,
}: {
  idx: number;
  publicAnswer: Answer;
  hostAnswer?: Answer;
  onClick?: () => void;
}) {
  const revealed = publicAnswer.revealed;
  const hostText = hostAnswer?.text ?? '';
  const isEmpty = !hostText && !revealed;
  const clickable = !!onClick && !revealed && !!hostText;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`relative h-16 md:h-20 rounded-lg border-2 flex items-center px-3 md:px-4 transition-all
        ${
          revealed
            ? 'bg-feud-board border-feud-accent text-white'
            : isEmpty
            ? 'bg-blue-900 border-blue-800 opacity-40'
            : 'bg-feud-panel border-blue-300'
        }
        ${clickable ? 'cursor-pointer hover:bg-blue-700' : 'cursor-default'}
      `}
    >
      <span
        className={`text-xl md:text-2xl font-display w-8 text-feud-accent ${
          revealed ? '' : 'opacity-70'
        }`}
      >
        {idx + 1}
      </span>
      <span className="flex-1 text-left text-lg md:text-xl">
        {revealed ? (
          publicAnswer.text
        ) : hostText ? (
          <span className="opacity-50 italic">{hostText}</span>
        ) : (
          <span className="opacity-20">—</span>
        )}
      </span>
      <span className="text-2xl md:text-3xl font-display text-feud-accent w-14 text-right">
        {revealed ? publicAnswer.points : hostAnswer && hostText ? (
          <span className="opacity-50">{hostAnswer.points}</span>
        ) : (
          ''
        )}
      </span>
    </button>
  );
}
