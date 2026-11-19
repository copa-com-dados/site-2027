import { useEffect, useState } from 'react';
import { Avatar } from '../../components/ui/Avatar';
import { ErrorState } from '../../components/ui/ErrorState';
import { Icon } from '../../components/ui/Icon';
import { Sheet } from '../../components/ui/Sheet';
import { Skeleton } from '../../components/ui/Skeleton';
import { deletePerson, savePerson, swapOrder, watchAllPeople } from '../../services/people';
import type { Person } from '../../types/schema';
import { PersonForm } from './PersonForm';

const GROUPS = [
  { kind: 'coordinator', title: 'Orientação' },
  { kind: 'student', title: 'Estudantes' },
] as const;

const iconBtn =
  'w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors';

export function PeopleEditor({ editorEmail }: { editorEmail: string }) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [editing, setEditing] = useState<Person | 'new' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => watchAllPeople(setPeople, setError), []);
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(t);
  }, [notice]);

  if (error) return <ErrorState message={error.message} />;
  if (!people) return <Skeleton className="h-64" />;

  const nextOrder = people.reduce((m, p) => Math.max(m, p.order), 0) + 1;

  const remove = async (p: Person) => {
    if (!window.confirm(`Remover ${p.name} do site? Esta ação não pode ser desfeita.`)) return;
    await deletePerson(p.id);
    setNotice(`${p.name} removido(a).`);
  };

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => setEditing('new')}
        className="w-full h-12 rounded-full bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all font-title-md text-[15px] font-semibold"
      >
        <Icon name="person_add" className="text-[20px]" />
        Adicionar pessoa
      </button>

      {GROUPS.map((group) => {
        const list = people.filter((p) => p.kind === group.kind);
        return (
          <section key={group.kind} className="flex flex-col gap-2">
            <h2 className="font-label-md text-[13px] text-on-surface font-semibold uppercase tracking-wider px-1">
              {group.title} <span className="text-on-surface-variant font-medium">({list.length})</span>
            </h2>
            {list.length === 0 ? (
              <p className="font-body-sm text-[13px] text-on-surface-variant bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
                Ninguém aqui ainda.
              </p>
            ) : (
              <ul className="bg-surface-container-lowest rounded-xl shadow-sm divide-y divide-surface-container">
                {list.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 p-3">
                    <Avatar name={p.name} src={p.photo || undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-title-md text-[15px] font-semibold text-on-surface truncate">
                          {p.name}
                        </span>
                        {!p.visible && (
                          <Icon
                            name="visibility_off"
                            className="text-[16px] text-outline"
                            title="Oculto no site"
                          />
                        )}
                      </div>
                      <p className="font-body-sm text-[13px] text-on-surface-variant truncate">
                        {[p.title, p.tag].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        type="button"
                        className={iconBtn}
                        disabled={i === 0}
                        onClick={() => swapOrder(p, list[i - 1]!)}
                        aria-label={`Mover ${p.name} para cima`}
                      >
                        <Icon name="arrow_upward" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        disabled={i === list.length - 1}
                        onClick={() => swapOrder(p, list[i + 1]!)}
                        aria-label={`Mover ${p.name} para baixo`}
                      >
                        <Icon name="arrow_downward" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        onClick={() => setEditing(p)}
                        aria-label={`Editar ${p.name}`}
                      >
                        <Icon name="edit" className="text-[18px]" />
                      </button>
                      <button
                        type="button"
                        className={`${iconBtn} hover:!text-error`}
                        onClick={() => remove(p)}
                        aria-label={`Remover ${p.name}`}
                      >
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {notice && (
        <div
          role="status"
          className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-[13px] shadow-lg animate-fadeIn"
        >
          {notice}
        </div>
      )}

      <Sheet
        open={editing !== null}
        title={editing === 'new' ? 'Adicionar pessoa' : 'Editar pessoa'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <PersonForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            nextOrder={nextOrder}
            onCancel={() => setEditing(null)}
            onSubmit={async (data) => {
              await savePerson(editing === 'new' ? null : editing.id, data, editorEmail);
              setNotice('Alterações salvas — já estão no site.');
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
