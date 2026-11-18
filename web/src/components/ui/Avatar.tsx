import { useState } from 'react';
import { initials } from '../../lib/format';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

/** Photo with an initials fallback (placeholder image URLs may expire). */
export function Avatar({ name, src, className = 'w-11 h-11' }: AvatarProps) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    return (
      <div
        className={`${className} rounded-full shrink-0 shadow-sm bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-title-md text-[15px] font-bold`}
        role="img"
        aria-label={name}
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      className={`${className} rounded-full object-cover shrink-0 shadow-sm`}
      alt={name}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
