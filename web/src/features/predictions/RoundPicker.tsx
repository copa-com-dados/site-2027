import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import type { RoundView } from '../../lib/rounds';

interface RoundPickerProps {
  rounds: readonly RoundView[];
  selected: RoundView;
  onSelect: (round: number) => void;
}

/** Round selector: published rounds are clickable, the rest show "em breve". */
export function RoundPicker({ rounds, selected, onSelect }: RoundPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="self-start flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-on-surface hover:bg-surface-container-low transition-colors active:scale-[0.98]"
      >
        <Icon name="calendar_month" className="text-primary text-[18px]" />
        <span className="font-label-md text-[14px] font-semibold">{selected.label}</span>
        <span className="font-label-sm text-[11px] text-on-surface-variant">· {selected.stage}</span>
        <Icon name="expand_more" className="text-on-surface-variant text-[20px]" />
      </button>

      <Sheet open={open} title="Escolha a rodada" onClose={() => setOpen(false)}>
        <ul className="flex flex-col gap-2" role="listbox" aria-label="Rodadas">
          {rounds.map((r) => {
            const isSelected = r.round === selected.round;
            return (
              <li key={r.round}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={!r.published}
                  disabled={!r.published}
                  onClick={() => {
                    if (!isSelected) onSelect(r.round);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-primary text-on-primary'
                      : r.published
                        ? 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                        : 'bg-surface-container-low/60 text-outline cursor-not-allowed'
                  }`}
                >
                  <span className="flex flex-col min-w-0">
                    <span className="font-title-md text-[15px] font-semibold leading-tight">{r.label}</span>
                    <span
                      className={`font-label-sm text-[11px] ${isSelected ? 'opacity-80' : 'text-on-surface-variant'}`}
                    >
                      {r.stage}
                    </span>
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 shrink-0 font-label-sm text-[11px] font-semibold">
                    {r.published ? (
                      <>
                        {r.matches.length} {r.matches.length === 1 ? 'jogo' : 'jogos'}
                        {isSelected && <Icon name="check" className="text-[18px]" />}
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                        em breve
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
