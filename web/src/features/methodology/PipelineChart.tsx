import { Icon } from '../../components/ui/Icon';
import type { MethodologyContent } from '../../types/schema';

export function PipelineChart({ pipeline }: { pipeline: MethodologyContent['pipeline'] }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-space-sm">
        <span className="font-label-md text-[13px] text-on-surface-variant flex items-center gap-1 font-semibold">
          <Icon name="auto_graph" className="text-secondary text-[16px]" />
          {pipeline.title}
        </span>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div
          className="h-20 lg:h-28 w-full flex items-end justify-between gap-1 pt-2 px-1"
          aria-hidden="true"
        >
          {pipeline.bars.map((bar) => (
            <div
              key={bar.label}
              className={`flex-1 rounded-t flex items-center justify-center ${
                bar.highlight
                  ? 'bg-primary text-on-primary text-[11px] font-bold'
                  : 'bg-surface-container-high text-primary text-[10px] font-semibold'
              }`}
              style={{ height: `${Math.round(bar.height * 100)}%` }}
            >
              <span className={bar.highlight ? undefined : 'opacity-70'}>{bar.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-outline text-[11px] font-body-sm px-1">
          <span>{pipeline.caption}</span>
          <span className="font-medium text-secondary">
            Ajuste de baixa pontuação (ρ = {pipeline.rho.toFixed(2)})
          </span>
        </div>
      </div>
    </section>
  );
}
