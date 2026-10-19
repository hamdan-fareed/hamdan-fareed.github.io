import React, { useEffect, useRef } from 'react';

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

interface Meteor {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  minSpeed: number;
  deceleration: number;
  angle: number; // in radians
  size: number;
  color: {
    primary: string;
    secondary: string;
    trailGlow: string;
  };
  trail: TrailPoint[];
  maxTrailLength: number;
  life: number;
  opacity: number;
  decayRate: number;
}

const METEOR_PALETTES = [
  // 1. Turquoise (explicit user requirement)
  {
    primary: '#00F5D4',
    secondary: '#06B6D4',
    trailGlow: 'rgba(6, 182, 212, 0.45)',
  },
  // 2. Vibrant Hot Magenta / Neon Pink
  {
    primary: '#FF2A85',
    secondary: '#D946EF',
    trailGlow: 'rgba(217, 70, 239, 0.4)',
  },
  // 3. Electric Violet / Cobalt
  {
    primary: '#8B5CF6',
    secondary: '#3B82F6',
    trailGlow: 'rgba(99, 102, 241, 0.4)',
  },
  // 4. Vibrant Cyber Lime / Mint
  {
    primary: '#10B981',
    secondary: '#34D399',
    trailGlow: 'rgba(16, 185, 129, 0.4)',
  },
];

export const MeteorCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const meteors: Meteor[] = [];
    let nextMeteorId = 0;
    let paletteIndex = 0;

    const spawnMeteor = () => {
      // Spawn along the right third of the screen
      const minX = width * 0.65;
      const maxX = width * 0.94;
      const startX = minX + Math.random() * (maxX - minX);
      const startY = -40;

      // Downward trajectory leaning slightly to the left (60 to 75 degrees)
      const angleDeg = 65 + (Math.random() * 15 - 7.5);
      const angleRad = (angleDeg * Math.PI) / 180;

      const initialSpeed = 20 + Math.random() * 8; // fast initial plunge
      const minSpeed = 0.28 + Math.random() * 0.2; // barely moving crawl

      const palette = METEOR_PALETTES[paletteIndex % METEOR_PALETTES.length];
      paletteIndex++;

      meteors.push({
        id: nextMeteorId++,
        x: startX,
        y: startY,
        vx: -Math.cos(angleRad) * initialSpeed,
        vy: Math.sin(angleRad) * initialSpeed,
        speed: initialSpeed,
        minSpeed,
        deceleration: 0.945, // smooth rapid deceleration
        angle: angleRad,
        size: 3.5,
        color: palette,
        trail: [],
        maxTrailLength: 45,
        life: 0,
        opacity: 1,
        decayRate: 0.0018, // long graceful presence
      });
    };

    // Spawn first turquoise meteor after a slight delay
    const initialTimer = setTimeout(() => {
      spawnMeteor();
    }, 600);

    // Periodically spawn new meteors
    let spawnCountdown = 280; // frames between spawns (~4.5s)

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Decrement spawn timer
      spawnCountdown--;
      if (spawnCountdown <= 0) {
        spawnMeteor();
        spawnCountdown = Math.floor(320 + Math.random() * 200); // 5-8 seconds between meteors
      }

      // Update and draw each meteor
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life++;

        // Decelerate speed sharply at first, easing into minSpeed
        if (m.speed > m.minSpeed) {
          m.speed = Math.max(m.minSpeed, m.speed * m.deceleration);
          m.vx = -Math.cos(m.angle) * m.speed;
          m.vy = Math.sin(m.angle) * m.speed;
        }

        m.x += m.vx;
        m.y += m.vy;

        // Record trail positions
        m.trail.unshift({ x: m.x, y: m.y, opacity: m.opacity });
        if (m.trail.length > m.maxTrailLength) {
          m.trail.pop();
        }

        // Draw luminous trail
        if (m.trail.length > 1) {
          for (let j = 0; j < m.trail.length - 1; j++) {
            const p1 = m.trail[j];
            const p2 = m.trail[j + 1];
            const progress = 1 - j / m.trail.length; // 1 at head, 0 at tail
            const segmentOpacity = progress * m.opacity * 0.85;

            // Retro glow halo
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = m.size * 2.2 * progress;
            ctx.strokeStyle = m.color.trailGlow;
            ctx.stroke();
            ctx.restore();

            // Core vibrant trail line
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineWidth = Math.max(1, m.size * progress);
            ctx.strokeStyle = j % 2 === 0 ? m.color.primary : m.color.secondary;
            ctx.globalAlpha = segmentOpacity;
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw meteor head (pixelated square head matching retro theme)
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = m.color.primary;
        ctx.shadowBlur = 12;
        const headSize = m.size * 1.5;
        // Pixel-like square head
        ctx.fillRect(
          Math.floor(m.x - headSize / 2),
          Math.floor(m.y - headSize / 2),
          Math.ceil(headSize),
          Math.ceil(headSize)
        );
        ctx.restore();

        // Subtle fading when reaching the lower screen after extended dwell
        if (m.y > height * 0.75 || m.life > 450) {
          m.opacity -= m.decayRate * 3;
        }

        // Remove dead meteors
        if (m.opacity <= 0 || m.y > height + 60 || m.x < -60) {
          meteors.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] w-full h-full"
    />
  );
};
