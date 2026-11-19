import { Avatar } from '../../components/ui/Avatar';
import type { MethodologyContent, Person } from '../../types/schema';

interface TeamProps {
  team: MethodologyContent['team'];
  /** Visible people from the `people` collection (edited in /admin). */
  people: readonly Person[];
}

export function Team({ team, people }: TeamProps) {
  const coordinators = people.filter((p) => p.kind === 'coordinator');
  const students = people.filter((p) => p.kind === 'student');
  if (people.length === 0) return null;

  return (
    <section className="flex flex-col space-y-space-sm">
      <div>
        <h2 className="font-title-lg text-[20px] font-semibold text-on-surface">{team.title}</h2>
        <p className="font-body-sm text-[13px] text-on-surface-variant">{team.subtitle}</p>
      </div>

      {coordinators.map((c) => (
        <div key={c.id} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
          <div className="flex items-center gap-space-md">
            <Avatar name={c.name} src={c.photo || undefined} className="w-14 h-14" />
            <div className="flex-1 min-w-0">
              <h3 className="font-title-md text-[16px] font-semibold text-on-surface leading-snug">
                {c.name}
              </h3>
              {c.title && <p className="font-body-sm text-[13px] text-on-surface-variant">{c.title}</p>}
              {c.subtitle && (
                <p className="font-label-sm text-[11px] text-secondary font-medium mt-0.5">{c.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}

      {students.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
          <span className="block font-label-md text-[13px] text-on-surface font-semibold uppercase tracking-wider">
            {team.studentsTitle}
          </span>
          {students.map((s) => (
            <div key={s.id} className="flex items-center gap-space-md">
              <Avatar name={s.name} src={s.photo || undefined} />
              <div className="flex-1 min-w-0">
                <h4 className="font-title-md text-[15px] font-semibold text-on-surface leading-snug">
                  {s.name}
                </h4>
                {s.title && <p className="font-body-sm text-[13px] text-on-surface-variant">{s.title}</p>}
                {s.subtitle && (
                  <p className="font-label-sm text-[11px] text-secondary font-medium">{s.subtitle}</p>
                )}
              </div>
              {s.tag && (
                <span className="font-label-sm text-[11px] text-on-surface-variant shrink-0">{s.tag}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
