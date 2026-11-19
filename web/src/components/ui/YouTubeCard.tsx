import { useState } from 'react';
import type { HomeContent } from '../../types/schema';
import { Icon } from './Icon';

/**
 * Lightweight YouTube embed: shows the thumbnail and only loads the (heavy)
 * privacy-enhanced iframe after the visitor presses play.
 */
export function YouTubeCard({ video }: { video: HomeContent['video'] }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;

  if (playing) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-inverse-surface shadow-sm aspect-video">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-highest shadow-sm group">
      <div
        className="w-full h-44 lg:h-auto lg:aspect-video bg-cover bg-center relative flex flex-col justify-between p-4"
        style={{ backgroundImage: `url('${thumb}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-inverse-surface/30 to-transparent" />

        <div className="relative z-10 flex justify-between items-center w-full">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-label-sm text-[11px] shadow-sm">
            <Icon name="play_circle" className="text-[14px] text-primary" />
            {video.duration}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <button
            onClick={() => setPlaying(true)}
            aria-label={`Assistir: ${video.title}`}
            className="pointer-events-auto w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:scale-105"
            type="button"
          >
            <Icon name="play_arrow" filled className="text-[32px] translate-x-0.5" />
          </button>
        </div>

        <div className="relative z-10">
          <p className="font-title-md text-[16px] font-semibold text-inverse-on-surface leading-tight">
            {video.title}
          </p>
          <p className="font-body-sm text-[13px] leading-[20px] text-surface-container-highest/90">
            {video.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
