import { AsyncView } from '../../components/ui/AsyncView';
import { useMethodologyContent, usePeople } from '../../hooks/useData';
import { combine } from '../../hooks/useQuery';
import { OpenScience } from './OpenScience';
import { PipelineChart } from './PipelineChart';
import { SampleExplorer } from './SampleExplorer';
import { Steps } from './Steps';
import { Team } from './Team';

export default function MethodologyPage() {
  return (
    <AsyncView state={combine(useMethodologyContent(), usePeople())}>
      {([content, people]) => (
        <div className="flex flex-col w-full pb-8 space-y-space-lg">
          <section className="flex flex-col pt-space-xs lg:max-w-3xl">
            <h1 className="font-headline-xl-mobile text-[28px] leading-[36px] lg:text-[44px] lg:leading-[52px] text-on-surface tracking-tight font-medium">
              {content.title}
            </h1>
            <p className="font-body-md text-[15px] leading-[24px] lg:text-[17px] lg:leading-[28px] text-on-surface-variant mt-1.5">
              {content.intro}
            </p>
          </section>

          <div className="flex flex-col space-y-space-lg lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0 lg:items-start">
            <div className="flex flex-col space-y-space-lg">
              <PipelineChart pipeline={content.pipeline} />
              <Steps steps={content.steps} />
            </div>
            <div className="flex flex-col space-y-space-lg">
              <SampleExplorer explorer={content.explorer} />
              <Team team={content.team} people={people} />
              <OpenScience repo={content.repo} ethics={content.ethics} />
            </div>
          </div>
        </div>
      )}
    </AsyncView>
  );
}
