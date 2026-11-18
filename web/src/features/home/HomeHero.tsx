import type { HomeContent } from '../../types/schema';

export function HomeHero({ content }: { content: HomeContent }) {
  return (
    <header className="flex flex-col pt-1 space-y-2.5 lg:max-w-3xl lg:pt-2 lg:pb-2">
      <h1 className="font-headline-xl-mobile text-[28px] leading-[36px] lg:text-[48px] lg:leading-[56px] text-on-surface tracking-tight font-normal">
        {content.title}
      </h1>
      <p className="font-body-md text-[15px] leading-[24px] lg:text-[17px] lg:leading-[28px] text-on-surface-variant">
        {content.subtitle}
      </p>
    </header>
  );
}
