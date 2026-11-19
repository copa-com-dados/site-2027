import { Icon } from '../../components/ui/Icon';
import type { HomeContent } from '../../types/schema';

export function FunFact({ fact }: { fact: HomeContent['funFact'] }) {
  return (
    <section className="bg-primary-fixed/50 rounded-xl p-3.5 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary">
        <Icon name="lightbulb" className="text-[18px]" />
      </div>
      <div className="flex flex-col space-y-0.5">
        <h3 className="font-title-md text-[15px] font-bold text-on-primary-fixed leading-tight">
          {fact.title}
        </h3>
        <p className="font-body-sm text-[13px] text-on-primary-fixed-variant leading-snug">{fact.body}</p>
      </div>
    </section>
  );
}
