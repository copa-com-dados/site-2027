import { Icon } from '../../components/ui/Icon';
import type { MethodologyContent } from '../../types/schema';

export function OpenScience({ repo, ethics }: Pick<MethodologyContent, 'repo' | 'ethics'>) {
  return (
    <section className="flex flex-col space-y-space-sm pt-space-xs">
      <a
        className="bg-surface-container-lowest active:bg-surface-container-high hover:shadow-md rounded-xl p-space-md shadow-sm flex items-center justify-between transition-all group"
        href={repo.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="flex items-center gap-space-md">
          <div className="w-11 h-11 rounded-xl bg-inverse-surface text-inverse-on-surface flex items-center justify-center shrink-0 shadow-sm">
            <Icon name="terminal" className="text-[24px]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-title-md text-[16px] text-on-surface font-semibold">{repo.title}</span>
              <Icon name="open_in_new" className="text-primary text-[16px]" />
            </div>
            <span className="font-body-sm text-[13px] text-on-surface-variant">{repo.subtitle}</span>
          </div>
        </div>
        <Icon name="chevron_right" className="text-outline group-hover:text-primary transition-colors text-[20px]" />
      </a>

      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-start gap-space-md">
        <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Icon name="policy" className="text-[22px]" />
        </div>
        <div className="flex-1">
          <h4 className="font-title-md text-[16px] text-on-surface font-semibold">{ethics.title}</h4>
          <p className="font-body-sm text-[13px] text-on-surface-variant mt-1 leading-relaxed">{ethics.body}</p>
        </div>
      </div>
    </section>
  );
}
