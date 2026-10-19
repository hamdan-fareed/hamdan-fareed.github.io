import React, { useState, useEffect, useRef } from 'react';

interface PixelCurtainProps {
  active: boolean;
  onMidpoint: () => void;
  onComplete: () => void;
  duration?: number;
}

const TOTAL_TILES = 32; // Exactly 32 large squares, each occupying 1/32 of the screen

export const PixelCurtain: React.FC<PixelCurtainProps> = ({
  active,
  onMidpoint,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'in' | 'out'>('idle');
  const [isPortrait, setIsPortrait] = useState(() => 
    typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false
  );

  const isRunningRef = useRef(false);
  const midpointTimerRef = useRef<NodeJS.Timeout | null>(null);
  const completeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep latest callbacks in refs so they never trigger effect restarts
  const onMidpointRef = useRef(onMidpoint);
  onMidpointRef.current = onMidpoint;

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Track window orientation for 8x4 (landscape) vs 4x8 (portrait)
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cols = isPortrait ? 4 : 8;
  const rows = isPortrait ? 8 : 4;

  const rowDelay = isPortrait ? 22 : 30;
  const colDelay = isPortrait ? 15 : 12;
  const flipDuration = 200; // ms per square flip
  const maxDelay = (rows - 1) * rowDelay + (cols - 1) * colDelay;
  const coverDuration = maxDelay + flipDuration;

  useEffect(() => {
    if (active) {
      // Guard: Ensure transition only executes once per activation
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      // Phase 1: Flip down into view to cover
      setPhase('in');

      // Midpoint: all 32 black squares are flat, swap page underneath
      midpointTimerRef.current = setTimeout(() => {
        onMidpointRef.current();

        // Phase 2: Flip down out of view to reveal
        setPhase('out');

        // Complete: finish cleanly and notify parent
        completeTimerRef.current = setTimeout(() => {
          isRunningRef.current = false;
          setPhase('idle');
          onCompleteRef.current();
        }, coverDuration + 30);
      }, coverDuration + 20);
    } else {
      isRunningRef.current = false;
      setPhase('idle');
      if (midpointTimerRef.current) clearTimeout(midpointTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    }

    return () => {
      if (midpointTimerRef.current) clearTimeout(midpointTimerRef.current);
      if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
    };
  }, [active, coverDuration]);

  if (phase === 'idle') return null;

  return (
    <div 
      aria-hidden="true"
      className={`fixed inset-0 z-50 pointer-events-none w-screen h-screen grid ${
        isPortrait ? 'grid-cols-4 grid-rows-8' : 'grid-cols-8 grid-rows-4'
      }`}
    >
      {Array.from({ length: TOTAL_TILES }).map((_, index) => {
        const r = Math.floor(index / cols);
        const c = index % cols;
        const delay = r * rowDelay + c * colDelay;

        return (
          <div
            key={index}
            className="w-full h-full bg-[#0a0a0a]"
            style={{
              animationName: phase === 'in' ? 'tile-flip-in' : 'tile-flip-out',
              animationDuration: `${flipDuration}ms`,
              animationTimingFunction: 'cubic-bezier(0.2, 0, 0.2, 1)',
              animationDelay: `${delay}ms`,
              animationFillMode: 'both',
            }}
          />
        );
      })}
    </div>
  );
};
