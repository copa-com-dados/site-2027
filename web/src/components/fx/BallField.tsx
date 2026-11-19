import { useEffect, useRef } from 'react';
import { ballSprite } from '../../lib/ballSprite';

const SPACING = 30; // px between grid points
const RADIUS = 150; // px of influence around the pointer
const DOT = 1.1; // resting dot radius
const GROW = 9; // extra radius right under the pointer
const DOT_COLOR = 'rgba(115, 118, 134, 0.22)';
const LINK_RGB = '0, 74, 198'; // primary

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Subtle page background: a grid of dots that turn into soccer balls and link
 * up like a small neural net around the pointer (or a tap on touch screens).
 * Only draws while something is moving.
 */
export function BallField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const sprite = ballSprite();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let fadeTimer = 0;
    const target = { x: -9999, y: -9999, on: 0 };
    const cur = { x: -9999, y: -9999, on: 0 };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / SPACING) + 1;
      const rows = Math.ceil(h / SPACING) + 1;
      const ox = (w % SPACING) / 2;
      const oy = (h % SPACING) / 2;
      const n = cols * rows;
      const infl = new Float32Array(n);
      const px = new Float32Array(n);
      const py = new Float32Array(n);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = ox + c * SPACING;
          const y = oy + r * SPACING;
          const dx = x - cur.x;
          const dy = y - cur.y;
          const d = Math.hypot(dx, dy);
          const t = cur.on * smooth(Math.max(0, 1 - d / RADIUS));
          const push = d > 0 ? (t * 7) / d : 0; // drift away from the pointer
          infl[i] = t;
          px[i] = x + dx * push;
          py[i] = y + dy * push;
        }
      }

      // links between neighbouring balls near the pointer
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (infl[i]! < 0.25) continue;
          const right = c + 1 < cols ? i + 1 : -1;
          const down = r + 1 < rows ? i + cols : -1;
          const diag = right >= 0 && down >= 0 ? i + cols + 1 : -1;
          for (const j of [right, down, diag]) {
            if (j < 0 || infl[j]! < 0.25) continue;
            ctx.strokeStyle = `rgba(${LINK_RGB}, ${(Math.min(infl[i]!, infl[j]!) * 0.22).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(px[i]!, py[i]!);
            ctx.lineTo(px[j]!, py[j]!);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = DOT_COLOR;
      for (let i = 0; i < n; i++) {
        const t = infl[i]!;
        const rad = DOT + t * GROW;
        if (t < 0.12) {
          ctx.beginPath();
          ctx.arc(px[i]!, py[i]!, rad, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = 0.2 + 0.55 * t;
          ctx.drawImage(sprite, px[i]! - rad, py[i]! - rad, rad * 2, rad * 2);
          ctx.globalAlpha = 1;
        }
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const tick = () => {
      const k = reduced ? 1 : 0.18;
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      cur.on += (target.on - cur.on) * (reduced ? 1 : 0.1);
      draw();
      const settled =
        Math.abs(target.x - cur.x) < 0.3 &&
        Math.abs(target.y - cur.y) < 0.3 &&
        Math.abs(target.on - cur.on) < 0.005;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (cur.on < 0.01) {
        // appear at the pointer instead of sliding in from far away
        cur.x = e.clientX;
        cur.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      target.on = 1;
      window.clearTimeout(fadeTimer);
      if (e.pointerType !== 'mouse') {
        fadeTimer = window.setTimeout(() => {
          target.on = 0;
          kick();
        }, 900);
      }
      kick();
    };
    const onLeave = () => {
      target.on = 0;
      kick();
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fadeTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="fixed inset-0 z-0 pointer-events-none" />;
}
