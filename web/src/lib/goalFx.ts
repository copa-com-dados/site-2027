/**
 * Simulator effects: ⚽ emojis flying across the screen while a matchup is
 * "simulated". Each ball stands for a simulated game: balls kicked from the
 * left are home wins, from the right away wins, and from the bottom draws,
 * in proportion to the model's probabilities.
 */
import type { OutcomeProbs } from '../types/schema';

let layer: HTMLDivElement | null = null;

function getLayer(): HTMLDivElement {
  if (layer && document.body.contains(layer)) return layer;
  layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: '40',
  });
  document.body.appendChild(layer);
  return layer;
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function ball(size: number): HTMLSpanElement {
  const el = document.createElement('span');
  el.textContent = '⚽';
  Object.assign(el.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    fontSize: `${size}px`,
    lineHeight: '1',
    willChange: 'transform, opacity',
    filter: 'drop-shadow(0 2px 3px rgba(13, 28, 47, 0.18))',
  });
  return el;
}

/** Parabolic flight from (x0, y0) to (x1, y1) peaking `lift` px above the straight line. */
function fly(
  el: HTMLElement,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  lift: number,
  spin: number,
  ms: number,
  delay: number,
) {
  const frames: Keyframe[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const x = x0 + (x1 - x0) * s;
    const y = y0 + (y1 - y0) * s - lift * 4 * s * (1 - s);
    const scale = 0.7 + 0.5 * Math.sin(Math.PI * s);
    frames.push({
      transform: `translate(${x}px, ${y}px) rotate(${spin * s}deg) scale(${scale})`,
      opacity: s < 0.08 ? s / 0.08 : s > 0.88 ? (1 - s) / 0.12 : 1,
    });
  }
  const anim = el.animate(frames, { duration: ms, delay, easing: 'linear', fill: 'both' });
  anim.onfinish = () => el.remove();
  anim.oncancel = () => el.remove();
}

/** Streams balls across the screen for `durationMs`. Returns a cancel function. */
export function launchGoals(probs: OutcomeProbs, durationMs: number): () => void {
  if (prefersReducedMotion()) return () => {};
  const root = getLayer();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const total = Math.round(Math.min(56, Math.max(26, w / 22)));
  const els: HTMLElement[] = [];

  for (let i = 0; i < total; i++) {
    const r = Math.random();
    const kind = r < probs.home ? 'home' : r < probs.home + probs.draw ? 'draw' : 'away';
    const size = rand(16, w < 640 ? 30 : 38);
    const el = ball(size);
    root.appendChild(el);
    els.push(el);
    // more balls early on, like a simulation ramping up
    const delay = Math.pow(Math.random(), 1.4) * durationMs * 0.7;
    const ms = rand(700, 1150);
    if (kind === 'draw') {
      const x = rand(w * 0.3, w * 0.7);
      fly(el, x, h + 20, x + rand(-80, 80), h + 20, rand(h * 0.45, h * 0.8), rand(-540, 540), ms, delay);
    } else {
      const fromLeft = kind === 'home';
      const x0 = fromLeft ? -size - 10 : w + 10;
      const x1 = fromLeft ? w + 10 : -size - 10;
      // aim at a "goal" on the far side, around mid-height
      fly(
        el,
        x0,
        rand(h * 0.35, h * 0.95),
        x1,
        rand(h * 0.35, h * 0.6),
        rand(60, h * 0.35),
        (fromLeft ? 1 : -1) * rand(360, 900),
        ms,
        delay,
      );
    }
  }
  return () => els.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
}

/** Small celebratory burst of balls from the center of an element. */
export function burstFrom(target: Element | null) {
  if (!target || prefersReducedMotion()) return;
  const root = getLayer();
  const rect = target.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const size = rand(12, 22);
    const el = ball(size);
    root.appendChild(el);
    const a = (i / n) * Math.PI * 2 + rand(-0.2, 0.2);
    const dist = rand(70, 150);
    const x0 = cx - size / 2;
    const y0 = cy - size / 2;
    const x1 = x0 + Math.cos(a) * dist;
    const y1 = y0 + Math.sin(a) * dist + 40; // a bit of gravity
    const anim = el.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(0.3) rotate(0deg)`, opacity: 0 },
        {
          transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2 - 30}px) scale(1.1) rotate(180deg)`,
          opacity: 1,
          offset: 0.45,
        },
        { transform: `translate(${x1}px, ${y1}px) scale(0.6) rotate(360deg)`, opacity: 0 },
      ],
      { duration: rand(650, 900), easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'both' },
    );
    anim.onfinish = () => el.remove();
  }
}
