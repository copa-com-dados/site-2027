/** Draws a small classic soccer ball (white with dark pentagons) on a canvas, once. */
let cached: HTMLCanvasElement | null = null;

function pentagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rot: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * 2 * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function ballSprite(size = 64, ink = '#434655'): HTMLCanvasElement {
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const R = size / 2 - 2;
  const m = size / 2;
  const up = -Math.PI / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(m, m, R, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = size / 40;
  pentagon(ctx, m, m, R * 0.36, up);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = up + (i * 2 * Math.PI) / 5;
    // seam from the center patch outwards, then an outer patch (clipped by the ball)
    ctx.beginPath();
    ctx.moveTo(m + R * 0.36 * Math.cos(a), m + R * 0.36 * Math.sin(a));
    ctx.lineTo(m + R * 0.75 * Math.cos(a), m + R * 0.75 * Math.sin(a));
    ctx.stroke();
    const b = a + Math.PI / 5;
    pentagon(ctx, m + R * 1.02 * Math.cos(b), m + R * 1.02 * Math.sin(b), R * 0.36, b);
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(m, m, R, 0, Math.PI * 2);
  ctx.lineWidth = size / 28;
  ctx.strokeStyle = ink;
  ctx.stroke();
  cached = c;
  return c;
}
