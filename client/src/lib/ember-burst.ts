type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

function originOf(target: HTMLElement | null) {
  if (!target) {
    return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  }
  const rect = target.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function emberColors() {
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const hsl = primary ? `hsl(${primary})` : "hsl(17 53% 47%)";
  return [hsl, "hsl(24 90% 55%)", "hsl(43 70% 58%)", "hsl(17 80% 32%)", "hsl(30 40% 88%)"];
}

export function fireEmberBurst(target: HTMLElement | null) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { x: ox, y: oy } = originOf(target);
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:120";
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  document.body.appendChild(canvas);

  const colors = emberColors();
  const particles: Particle[] = Array.from({ length: 72 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3.2 + Math.random() * 7.5;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2.4,
      life: 1,
      size: 2 + Math.random() * 3.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  const started = performance.now();

  function frame(now: number) {
    if (!ctx) return;
    const elapsed = now - started;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const p of particles) {
      p.vy += 0.16;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.life = Math.max(0, 1 - elapsed / 1100);
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    if (elapsed < 1100) {
      requestAnimationFrame(frame);
      return;
    }
    canvas.remove();
  }

  requestAnimationFrame(frame);
}
