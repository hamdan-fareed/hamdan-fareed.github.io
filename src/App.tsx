/**
 * Hamdan - Personal Identity & Directory
 * Clean typography without body logo, tab favicon only.
 */
import React, { useState, useEffect, useRef } from 'react';
import { PixelCurtain } from './PixelCurtain';
import { MagneticCursor } from './MagneticCursor';

interface LinkItem {
  id: string;
  label: string;
  href?: string;
  isExternal?: boolean;
  isComingSoon?: boolean;
  comingSoonTitle?: string;
}

const SCRAMBLE_GLYPHS = '01#%*+=-_~<>/?\\!&$';

/**
 * ScrambleText with "Stagger from center" effect:
 * Characters resolve from the center of the string outward to the edges.
 */
function ScrambleText({
  text,
  delay = 0,
  duration = 650,
  className = '',
  triggerKey = 0,
}: {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  triggerKey?: string | number;
}) {
  const [displayText, setDisplayText] = useState(text);
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;
    const targetText = text;
    const len = targetText.length;
    if (len === 0) return;

    const center = (len - 1) / 2;
    const maxDist = Math.max(center, len - 1 - center) || 1;

    // Calculate when each character locks in: center characters lock first, outer last
    const resolveTimes = targetText.split('').map((char, i) => {
      if (char === ' ') return { isSpace: true, time: 0 };
      const dist = Math.abs(i - center);
      const ratio = dist / maxDist; // 0 at center, 1 at boundaries
      // Stagger from center: center resolves at 35% through the animation, ends at 100%
      const lockTime = delay + duration * (0.35 + 0.65 * ratio);
      return { isSpace: false, time: lockTime };
    });

    const totalDuration = delay + duration;
    let lastGlyphTime = 0;
    let currentRandoms = targetText.split('').map(() =>
      SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
    );

    const step = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      // Update random scrambling glyphs every ~35ms for snappy retro cadence
      if (now - lastGlyphTime > 35) {
        lastGlyphTime = now;
        currentRandoms = targetText.split('').map(() =>
          SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
        );
      }

      const next = targetText.split('').map((targetChar, i) => {
        if (targetChar === ' ') return ' ';
        if (elapsed < delay) {
          // Scrambling before lock-in window
          return currentRandoms[i];
        }
        if (elapsed >= resolveTimes[i].time) {
          // Locked to the real character
          return targetChar;
        }
        // Still scrambling
        return currentRandoms[i];
      });

      setDisplayText(next.join(''));

      if (elapsed < totalDuration) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayText(targetText);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, delay, duration, triggerKey]);

  return <span className={className}>{displayText}</span>;
}

type ScreenType = 'home' | 'docs' | 'ayah-detect' | 'blog';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingScreenRef = useRef<ScreenType | null>(null);
  const wordmarkRef = useRef<HTMLHeadingElement | null>(null);
  const subtitleRef = useRef<HTMLParagraphElement | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [scrambleKey, setScrambleKey] = useState(0);

  // Trigger pixel flip transition strictly once per click
  const triggerPageTransition = (target: ScreenType) => {
    if (isTransitioning || target === activeScreen) return;
    pendingScreenRef.current = target;
    setIsTransitioning(true);
  };

  const handleCurtainMidpoint = () => {
    if (pendingScreenRef.current) {
      setActiveScreen(pendingScreenRef.current);
      pendingScreenRef.current = null;
      setScrambleKey(k => k + 1);
    }
  };

  const handleCurtainComplete = () => {
    setIsTransitioning(false);
  };

  // Link definitions matching Hamdan's specifications
  const links: LinkItem[] = [
    {
      id: 'docs',
      label: 'docs',
      isComingSoon: true,
      comingSoonTitle: 'docs',
    },
    {
      id: 'mail',
      label: 'mail',
      href: 'mailto:hamdanfareedibniqbal@gmail.com',
      isExternal: false,
    },
    {
      id: 'blog',
      label: 'blog',
      isComingSoon: true,
      comingSoonTitle: 'blog',
    },
    {
      id: 'books',
      label: 'books',
      href: 'https://many.bio/Hamdan',
      isExternal: true,
    },
    {
      id: 'github',
      label: 'GitHub',
      href: 'https://github.com/hamdan-fareed',
      isExternal: true,
    },
    {
      id: 'youtube',
      label: 'youtube',
      href: 'https://www.youtube.com/@hamdanfareed',
      isExternal: true,
    },
    {
      id: 'ayah-detect',
      label: 'Ayah detect',
      isComingSoon: true,
      comingSoonTitle: 'ayah detect',
    },
  ];

  // Keyboard navigation: Escape key returns home via pixel transition
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeScreen !== 'home') {
        triggerPageTransition('home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeScreen, isTransitioning]);

  const handleLinkClick = (e: React.MouseEvent, link: LinkItem) => {
    if (link.isComingSoon) {
      e.preventDefault();
      triggerPageTransition(link.id as ScreenType);
      return;
    }

    if (link.id === 'mail') {
      // Trigger mailto and provide friendly copy feedback
      navigator.clipboard?.writeText('hamdanfareedibniqbal@gmail.com').then(() => {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2600);
      }).catch(() => {
        // Fallback silently if clipboard permissions are restricted
      });
    }
  };

  const getActiveTitle = () => {
    if (activeScreen !== 'home') {
      return 'Coming soon';
    }
    return 'hamdan';
  };

  const getActiveSubtitle = () => {
    if (activeScreen === 'ayah-detect') {
      return 'ayah detect';
    }
    if (activeScreen === 'docs') {
      return 'documentation';
    }
    if (activeScreen === 'blog') {
      return 'blog';
    }
    return 'trying to build';
  };

  // Optical center of the 7-item link list (index 3 is "books")
  const centerLinkIndex = (links.length - 1) / 2;

  return (
    <main className="relative min-h-screen w-full bg-white flex flex-col justify-center items-center px-4 py-12 select-none overflow-hidden">
      {/* Subtle slow-moving pixelated grain overlay */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed -inset-8 pixel-grain-layer opacity-[0.04] z-0" 
      />

        {/* Central Identity Container */}
      <div className={`relative z-10 w-full max-w-md flex flex-col items-center text-center transition-all duration-300 ${isTransitioning ? 'opacity-75 scale-[0.99] filter contrast-125' : 'opacity-100 scale-100'}`}>
        
        {/* Main Pixel Title with center-stagger scramble and magnetic target */}
        <h1 
          ref={wordmarkRef}
          onClick={() => setScrambleKey(k => k + 1)}
          className="font-pixel text-4xl sm:text-5xl md:text-6xl text-zinc-950 tracking-tight leading-none mb-4 transition-colors duration-150 cursor-pointer magnetic-wordmark select-none"
          style={{ imageRendering: 'pixelated' }}
          title="Click to re-scramble"
        >
          <ScrambleText 
            text={getActiveTitle()} 
            delay={40} 
            duration={580} 
            triggerKey={`${activeScreen}-${scrambleKey}`} 
          />
        </h1>

        {/* Monospaced Subtitle with center-stagger scramble and magnetic target */}
        <p 
          ref={subtitleRef}
          className="font-mono-clean text-xs sm:text-sm text-zinc-600 tracking-[0.2em] mb-12 lowercase magnetic-wordmark select-none inline-block transition-colors duration-150 cursor-pointer"
        >
          <ScrambleText 
            text={getActiveSubtitle()} 
            delay={180} 
            duration={620} 
            triggerKey={`${activeScreen}-${scrambleKey}`} 
          />
        </p>

        {/* Dynamic Navigation View */}
        {activeScreen === 'home' ? (
          <nav 
            aria-label="Personal channels"
            className="flex flex-col items-center gap-3 w-full"
          >
            {links.map((link, index) => {
              // Stagger start time from vertical center ("books" first, rippling outward)
              const verticalDist = Math.abs(index - centerLinkIndex);
              const linkDelay = 320 + verticalDist * 70;

              const content = (
                <span className="font-mono-clean text-xs sm:text-sm tracking-widest text-[#1a3838] hover:text-black inline-flex items-center justify-center transition-transform duration-100 group-hover:scale-[1.04]">
                  <span className="text-zinc-400 group-hover:text-zinc-600 mr-2">[</span>
                  <span>
                    <ScrambleText 
                      text={link.label} 
                      delay={linkDelay} 
                      duration={480} 
                      triggerKey={`${activeScreen}-${scrambleKey}`} 
                    />
                  </span>
                  <span className="text-zinc-400 group-hover:text-zinc-600 ml-2">]</span>
                </span>
              );

              if (link.isComingSoon) {
                return (
                  <button
                    key={link.id}
                    onClick={(e) => handleLinkClick(e, link)}
                    className="group min-h-[44px] px-4 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
                    aria-label={`View ${link.label} status`}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  onClick={(e) => handleLinkClick(e, link)}
                  className="group min-h-[44px] px-4 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 transition-colors"
                >
                  {content}
                </a>
              );
            })}
          </nav>
        ) : (
          /* Coming Soon View State */
          <div className="flex flex-col items-center gap-6 w-full animate-fade-in">
            <button
              onClick={() => triggerPageTransition('home')}
              className="group min-h-[44px] px-4 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              aria-label="Return to main links"
            >
              <span className="font-mono-clean text-xs sm:text-sm tracking-widest text-[#1a3838] hover:text-black inline-flex items-center justify-center group-hover:scale-[1.04] transition-transform duration-100">
                <span className="text-zinc-400 group-hover:text-zinc-600 mr-2">[</span>
                <span>
                  <ScrambleText 
                    text="back" 
                    delay={200} 
                    duration={420} 
                    triggerKey={`${activeScreen}-${scrambleKey}`} 
                  />
                </span>
                <span className="text-zinc-400 group-hover:text-zinc-600 ml-2">]</span>
              </span>
            </button>
          </div>
        )}

        {/* Email Copied Notification */}
        {copiedEmail && (
          <div 
            role="status" 
            aria-live="polite"
            className="fixed bottom-8 px-4 py-2 bg-zinc-900 text-white font-mono-clean text-xs tracking-wider rounded-none shadow-md transition-opacity duration-200"
          >
            [ email copied: hamdanfareedibniqbal@gmail.com ]
          </div>
        )}

      </div>

      {/* Cinematic Pixel Curtain Page Transition */}
      <PixelCurtain
        active={isTransitioning}
        onMidpoint={handleCurtainMidpoint}
        onComplete={handleCurtainComplete}
        duration={720}
      />

      {/* iPadOS-style Magnetic Cursor & Snap on Hamdan wordmark and subtitle */}
      <MagneticCursor targetRefs={[wordmarkRef, subtitleRef]} />
    </main>
  );
}
