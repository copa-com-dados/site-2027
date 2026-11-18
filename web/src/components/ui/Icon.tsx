import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  className?: string;
  filled?: boolean;
  title?: string;
}

const FILLED: CSSProperties = { fontVariationSettings: "'FILL' 1" };

/** Material Symbols Outlined glyph. Decorative unless `title` is given. */
export function Icon({ name, className = '', filled, title }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? FILLED : undefined}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      title={title}
    >
      {name}
    </span>
  );
}
