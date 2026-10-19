import React, { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';

interface MagneticCursorProps {
  targetRefs: Array<React.RefObject<HTMLElement | null>>;
}

export const MagneticCursor: React.FC<MagneticCursorProps> = ({ targetRefs }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSnapped, setIsSnapped] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const activeTargetElRef = useRef<HTMLElement | null>(null);

  // Raw cursor position values
  const rawX = useMotionValue(-100);
  const rawY = useMotionValue(-100);

  // Spring physics for cursor positioning and morphing (iPadOS dynamic feel)
  const springConfig = { stiffness: 420, damping: 30, mass: 0.5 };
  const morphConfig = { stiffness: 320, damping: 28, mass: 0.8 };

  const cursorX = useSpring(rawX, springConfig);
  const cursorY = useSpring(rawY, springConfig);

  const cursorWidth = useSpring(12, morphConfig);
  const cursorHeight = useSpring(12, morphConfig);
  const cursorRadius = useSpring(999, morphConfig);
  const cursorScale = useSpring(1, { stiffness: 500, damping: 25 });

  // Spring values for the target text reaction
  const textX = useSpring(0, { stiffness: 350, damping: 26 });
  const textY = useSpring(0, { stiffness: 350, damping: 26 });
  const textScale = useSpring(1, { stiffness: 350, damping: 26 });

  // Sync target element's magnetic displacement directly for 120fps performance
  useEffect(() => {
    const unsubX = textX.on('change', (latestX) => {
      if (activeTargetElRef.current) {
        activeTargetElRef.current.style.setProperty('--mag-x', `${latestX}px`);
      }
    });
    const unsubY = textY.on('change', (latestY) => {
      if (activeTargetElRef.current) {
        activeTargetElRef.current.style.setProperty('--mag-y', `${latestY}px`);
      }
    });
    const unsubScale = textScale.on('change', (latestScale) => {
      if (activeTargetElRef.current) {
        activeTargetElRef.current.style.setProperty('--mag-scale', `${latestScale}`);
      }
    });

    return () => {
      unsubX();
      unsubY();
      unsubScale();
    };
  }, [textScale, textX, textY]);

  // Helper to reset transform on an element
  const resetElementTransform = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.setProperty('--mag-x', '0px');
    el.style.setProperty('--mag-y', '0px');
    el.style.setProperty('--mag-scale', '1');
  };

  useEffect(() => {
    // Only enable on pointer/fine devices (desktop/trackpad/mouse)
    const media = window.matchMedia('(pointer: fine)');
    if (!media.matches) return;

    // Apply cursor-none so our custom fluid cursor replaces the system arrow
    document.documentElement.classList.add('custom-magnetic-cursor-active');

    const handlePointerMove = (e: PointerEvent) => {
      if (!isVisible) setIsVisible(true);

      // Collect active elements from targetRefs
      const validElements = targetRefs
        .map((ref) => ref.current)
        .filter((el): el is HTMLElement => el !== null && el.offsetParent !== null);

      if (validElements.length === 0) {
        rawX.set(e.clientX);
        rawY.set(e.clientY);
        cursorWidth.set(12);
        cursorHeight.set(12);
        cursorRadius.set(999);
        setIsSnapped(false);
        textX.set(0);
        textY.set(0);
        textScale.set(1);
        return;
      }

      // Calculate distance and bounding box for each candidate target
      let closestElement: HTMLElement | null = null;
      let minDistance = Infinity;
      let closestRect: DOMRect | null = null;

      for (const el of validElements) {
        const rect = el.getBoundingClientRect();
        const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
        const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
        const distance = Math.hypot(dx, dy);

        if (distance < minDistance) {
          minDistance = distance;
          closestElement = el;
          closestRect = rect;
        }
      }

      const MAGNETIC_THRESHOLD = 75; // Proximity threshold in pixels

      if (closestElement && closestRect && minDistance === 0) {
        // --- SNAPPED STATE ---
        // Pointer is inside this target
        if (activeTargetElRef.current && activeTargetElRef.current !== closestElement) {
          resetElementTransform(activeTargetElRef.current);
        }
        activeTargetElRef.current = closestElement;
        setIsSnapped(true);

        const targetCenterX = closestRect.left + closestRect.width / 2;
        const targetCenterY = closestRect.top + closestRect.height / 2;

        const isSmallText = closestRect.height < 32;
        const paddingX = isSmallText ? 18 : 24;
        const paddingY = isSmallText ? 8 : 14;
        const snappedW = closestRect.width + paddingX;
        const snappedH = closestRect.height + paddingY;
        const radius = isSmallText ? 8 : 14;

        cursorWidth.set(snappedW);
        cursorHeight.set(snappedH);
        cursorRadius.set(radius);

        // Magnetic rubberband pull inside target
        const pullX = (e.clientX - targetCenterX) * 0.22;
        const pullY = (e.clientY - targetCenterY) * 0.22;

        rawX.set(targetCenterX + pullX);
        rawY.set(targetCenterY + pullY);

        // The text element itself magnetically shifts towards the pointer
        textX.set((e.clientX - targetCenterX) * 0.18);
        textY.set((e.clientY - targetCenterY) * 0.18);
        textScale.set(isPressing ? 0.98 : 1.035);
      } else if (closestElement && closestRect && minDistance < MAGNETIC_THRESHOLD) {
        // --- MAGNETIC APPROACH STATE ---
        // Pointer is in the invisible magnetic field nearing this target
        if (activeTargetElRef.current && activeTargetElRef.current !== closestElement) {
          resetElementTransform(activeTargetElRef.current);
        }
        activeTargetElRef.current = closestElement;
        setIsSnapped(false);

        const targetCenterX = closestRect.left + closestRect.width / 2;
        const targetCenterY = closestRect.top + closestRect.height / 2;

        const pullStrength = Math.pow(1 - minDistance / MAGNETIC_THRESHOLD, 1.8);

        // Cursor eases and accelerates toward target center
        const magneticX = e.clientX + (targetCenterX - e.clientX) * (pullStrength * 0.45);
        const magneticY = e.clientY + (targetCenterY - e.clientY) * (pullStrength * 0.45);

        rawX.set(magneticX);
        rawY.set(magneticY);

        // Morph slightly from circle toward an enlarged soft pill
        const sizeInterpolation = 12 + pullStrength * 16;
        cursorWidth.set(sizeInterpolation);
        cursorHeight.set(sizeInterpolation);
        cursorRadius.set(999);

        // Subtle pull on the text as the cursor approaches
        textX.set((e.clientX - targetCenterX) * (pullStrength * 0.08));
        textY.set((e.clientY - targetCenterY) * (pullStrength * 0.08));
        textScale.set(1 + pullStrength * 0.015);
      } else {
        // --- FREE MOVEMENT OVER EMPTY CANVAS & LINKS ---
        if (activeTargetElRef.current) {
          resetElementTransform(activeTargetElRef.current);
          activeTargetElRef.current = null;
        }

        setIsSnapped(false);
        rawX.set(e.clientX);
        rawY.set(e.clientY);
        cursorWidth.set(12);
        cursorHeight.set(12);
        cursorRadius.set(999);

        textX.set(0);
        textY.set(0);
        textScale.set(1);
      }
    };

    const handlePointerDown = () => {
      setIsPressing(true);
      cursorScale.set(0.92);
      if (isSnapped) {
        textScale.set(0.97);
      }
    };

    const handlePointerUp = () => {
      setIsPressing(false);
      cursorScale.set(1);
      if (isSnapped) {
        textScale.set(1.035);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsSnapped(false);
      if (activeTargetElRef.current) {
        resetElementTransform(activeTargetElRef.current);
        activeTargetElRef.current = null;
      }
      textX.set(0);
      textY.set(0);
      textScale.set(1);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.documentElement.classList.remove('custom-magnetic-cursor-active');
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (activeTargetElRef.current) {
        resetElementTransform(activeTargetElRef.current);
      }
    };
  }, [cursorHeight, cursorRadius, cursorScale, cursorWidth, isPressing, isSnapped, isVisible, rawX, rawY, targetRefs, textScale, textX, textY]);

  if (!isVisible) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed pointer-events-none z-40 -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{
        left: cursorX,
        top: cursorY,
        width: cursorWidth,
        height: cursorHeight,
        borderRadius: cursorRadius,
        scale: cursorScale,
        backgroundColor: isSnapped 
          ? 'rgba(15, 23, 42, 0.08)' 
          : 'rgba(24, 24, 27, 0.38)',
        border: isSnapped 
          ? '1px solid rgba(15, 23, 42, 0.12)' 
          : '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: isSnapped
          ? '0 4px 14px -2px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02)'
          : 'none',
        backdropFilter: isSnapped ? 'blur(2px)' : 'none',
        transition: 'background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
      }}
    />
  );
};
