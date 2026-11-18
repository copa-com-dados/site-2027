import { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import type { Team } from '../../types/schema';

type Side = 'home' | 'away';

interface TeamSlotProps {
  team: Team;
  role: string;
  onOpen: () => void;
}

function TeamSlot({ team, role, onOpen }: TeamSlotProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${role}: ${team.name}. Trocar seleção`}
      className="relative flex flex-col items-center justify-center p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center text-2xl shadow-sm mb-2">
        <span>{team.flag}</span>
      </div>
      <span className="font-title-md text-[16px] font-semibold text-on-surface text-center truncate w-full">{team.name}</span>
      <span className="font-label-sm text-[11px] text-on-surface-variant mt-0.5">{role}</span>
      <span className="mt-2 flex items-center gap-1 text-primary font-label-sm text-[11px] font-semibold">
        Trocar
        <Icon name="expand_more" className="text-[14px]" />
      </span>
    </button>
  );
}

interface TeamPickerProps {
  home: Team;
  away: Team;
  teams: readonly Team[];
  onPick: (side: Side, code: string) => void;
  onSwap: () => void;
}

const ROLE: Record<Side, string> = { home: 'Mandante', away: 'Visitante' };

export function TeamPicker({ home, away, teams, onPick, onSwap }: TeamPickerProps) {
  const [editing, setEditing] = useState<Side | null>(null);
  const current = editing === 'home' ? home : away;
  const other = editing === 'home' ? away : home;

  return (
    <div className="relative bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
      <div className="grid grid-cols-2 gap-space-md relative items-center">
        <TeamSlot team={home} role={ROLE.home} onOpen={() => setEditing('home')} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={onSwap}
            aria-label="Inverter mandante e visitante"
            title="Inverter mandante e visitante"
            className="w-10 h-10 rounded-full bg-surface-container text-on-surface flex items-center justify-center shadow-md hover:bg-surface-container-high active:rotate-180 transition-transform duration-300"
            type="button"
          >
            <span className="font-label-sm text-[11px] font-bold tracking-tight">VS</span>
          </button>
        </div>
        <TeamSlot team={away} role={ROLE.away} onOpen={() => setEditing('away')} />
      </div>

      <Sheet
        open={editing !== null}
        title={editing ? `Escolha a seleção ${editing === 'home' ? 'mandante' : 'visitante'}` : ''}
        onClose={() => setEditing(null)}
      >
        <ul className="grid grid-cols-2 gap-2" role="listbox" aria-label="Seleções">
          {teams.map((t) => {
            const selected = t.code === current.code;
            const isOther = t.code === other.code;
            return (
              <li key={t.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    if (editing && !selected) onPick(editing, t.code);
                    setEditing(null);
                  }}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-colors ${
                    selected
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span
                    className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[18px] shadow-sm ${
                      selected ? 'bg-surface-container-lowest/20' : 'bg-surface-container-lowest'
                    }`}
                  >
                    {t.flag}
                  </span>
                  <span className="flex flex-col min-w-0">
                    <span className="font-title-md text-[14px] font-semibold leading-tight">{t.name}</span>
                    {isOther && (
                      <span className={`font-label-sm text-[11px] ${selected ? 'opacity-80' : 'text-on-surface-variant'}`}>
                        Inverte o confronto
                      </span>
                    )}
                  </span>
                  {selected && <Icon name="check" className="ml-auto text-[18px]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}
