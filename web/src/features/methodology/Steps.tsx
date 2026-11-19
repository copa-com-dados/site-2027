import { Icon } from '../../components/ui/Icon';
import type { MethodologyContent } from '../../types/schema';

type Step = MethodologyContent['steps'][number];

// Literal class strings per variant (Tailwind cannot see class names built from data).
const VARIANTS: Record<Step['variant'], { box: string; label: string; foot: string }> = {
  data: {
    box: 'bg-surface-container text-primary',
    label: 'text-primary',
    foot: 'text-secondary',
  },
  model: {
    box: 'bg-surface-container-high text-primary-container',
    label: 'text-primary',
    foot: 'text-primary',
  },
  simulation: {
    box: 'bg-secondary-fixed text-on-secondary-fixed-variant',
    label: 'text-secondary',
    foot: 'text-secondary',
  },
};

export function Steps({ steps }: { steps: MethodologyContent['steps'] }) {
  return (
    <section className="flex flex-col space-y-space-md">
      <div className="flex items-center justify-between">
        <h2 className="font-title-lg text-[20px] font-semibold text-on-surface">Etapas da Estimativa</h2>
        <span className="font-label-sm text-[11px] text-outline font-medium">
          {steps.length} fases sequenciais
        </span>
      </div>

      {steps.map((step) => {
        const v = VARIANTS[step.variant];
        return (
          <article
            key={step.label}
            className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm relative overflow-hidden transition-all active:scale-[0.99]"
          >
            <div className="flex items-start gap-space-md">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${v.box}`}>
                <Icon name={step.icon} className="text-[26px]" />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`font-label-sm text-[11px] tracking-wide uppercase font-semibold ${v.label}`}
                >
                  {step.label}
                </span>
                <h3 className="font-title-md text-[16px] font-semibold text-on-surface mt-0.5">
                  {step.title}
                </h3>
                <p className="font-body-md text-[15px] leading-[24px] text-on-surface-variant mt-1.5">
                  {step.body}
                </p>
                <div className="mt-space-sm pt-space-xs flex items-center gap-2">
                  <Icon name={step.footIcon} className={`text-[16px] ${v.foot}`} />
                  <span className={`font-body-sm text-[13px] font-medium ${v.foot}`}>{step.footnote}</span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
