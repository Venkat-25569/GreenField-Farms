import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, Sparkles } from 'lucide-react';

interface CinematicIntroProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

export function CinematicIntro({ onComplete, forcePlay = false }: CinematicIntroProps) {
  const [stage, setStage] = useState<'visual' | 'text' | 'exit' | 'done'>('visual');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check sessionStorage and prefers-reduced-motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasPlayed = sessionStorage.getItem('venkat_farms_intro_played');

    if (!forcePlay && (prefersReducedMotion || hasPlayed === 'true')) {
      setStage('done');
      onComplete?.();
      return;
    }

    // Generate floating golden dust particles
    const generated = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1.5,
      duration: Math.random() * 4 + 3.5,
      delay: Math.random() * 2,
    }));
    setParticles(generated);

    // Timeline:
    // 0s: Bull sunset visual + dust + birds + sun pulse
    // 3.0s: Bull background blurs/dims, "Venkat_farms_ceo" appears letter by letter + logo draw + tagline
    // 6.2s: Curtain split / fade upward
    // 6.9s: Done
    const textTimer = setTimeout(() => {
      setStage('text');
    }, 2800);

    const exitTimer = setTimeout(() => {
      setStage('exit');
    }, 6000);

    const doneTimer = setTimeout(() => {
      sessionStorage.setItem('venkat_farms_intro_played', 'true');
      setStage('done');
      onComplete?.();
    }, 6900);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [forcePlay, onComplete]);

  // Birds canvas animation
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

    // Bird flock
    const birds = Array.from({ length: 6 }).map((_, i) => ({
      x: -50 - i * 60,
      y: height * 0.18 + (i % 3) * 25 + Math.random() * 20,
      speed: 1.8 + Math.random() * 0.8,
      size: 10 + Math.random() * 6,
      wingState: 0,
      wingSpeed: 0.12 + Math.random() * 0.04,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      birds.forEach((bird) => {
        bird.x += bird.speed;
        bird.wingState += bird.wingSpeed;
        const wingOffset = Math.sin(bird.wingState) * (bird.size * 0.4);

        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
        ctx.beginPath();
        // Left wing
        ctx.moveTo(bird.x - bird.size, bird.y - wingOffset);
        // Center body
        ctx.quadraticCurveTo(bird.x - bird.size * 0.3, bird.y - wingOffset * 0.5, bird.x, bird.y);
        // Right wing
        ctx.quadraticCurveTo(bird.x + bird.size * 0.3, bird.y - wingOffset * 0.5, bird.x + bird.size, bird.y - wingOffset);
        // Underbody curve
        ctx.quadraticCurveTo(bird.x, bird.y + 2, bird.x - bird.size, bird.y - wingOffset);
        ctx.fill();
        ctx.restore();

        if (bird.x > width + 50) {
          bird.x = -60;
          bird.y = height * 0.15 + Math.random() * (height * 0.25);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSkip = () => {
    sessionStorage.setItem('venkat_farms_intro_played', 'true');
    setStage('done');
    onComplete?.();
  };

  if (stage === 'done') {
    return null;
  }

  const brandName = 'Venkat_farms_ceo';
  const letters = Array.from(brandName);

  return (
    <AnimatePresence>
      <motion.div
        key="cinematic-intro-container"
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black select-none pointer-events-auto"
        initial={{ opacity: 1 }}
          animate={
            stage === 'exit'
              ? {
                  opacity: 0,
                  y: '-100%',
                  transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] },
                }
              : { opacity: 1 }
          }
          exit={{ opacity: 0, y: '-100%' }}
        >
          {/* Ken Burns Background Image */}
          <motion.div
            className="absolute inset-0 w-full h-full bg-center bg-cover"
            style={{
              backgroundImage: `url('/images/bulls-sunset.jpg')`,
            }}
            initial={{ scale: 1 }}
            animate={{
              scale: 1.15,
              filter: stage === 'text' || stage === 'exit' ? 'blur(8px) brightness(0.45)' : 'blur(0px) brightness(0.9)',
            }}
            transition={{
              scale: { duration: 7, ease: 'easeOut' },
              filter: { duration: 1.2, ease: 'easeInOut' },
            }}
          />

          {/* Golden Sun Glow Pulse (Positioned in upper-center near the horizon sun) */}
          <div
            className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(245, 197, 66, 0.45) 0%, rgba(249, 115, 22, 0.25) 45%, rgba(0,0,0,0) 70%)',
              animation: 'pulseGlow 4s infinite ease-in-out',
            }}
          />

          {/* Vignette & Color Atmosphere Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-transparent to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />

          {/* Canvas for Drifting Bird Silhouettes */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

          {/* Floating Golden Dust Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  background: 'radial-gradient(circle, #fef08a 0%, #f5c542 60%, rgba(245, 197, 66, 0) 100%)',
                  boxShadow: '0 0 8px rgba(245, 197, 66, 0.8)',
                }}
                animate={{
                  y: [0, -60, -120],
                  x: [0, (p.id % 2 === 0 ? 15 : -15), 0],
                  opacity: [0, 0.9, 0],
                  scale: [0.8, 1.2, 0.5],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Central Cinematic Reveal Content */}
          <div className="relative z-30 flex flex-col items-center justify-center text-center px-4 max-w-4xl">
            {stage === 'text' || stage === 'exit' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                {/* Self-drawing Bull & Leaf Emblem Logo */}
                <motion.div
                  className="mb-4 relative w-20 h-20 flex items-center justify-center"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="absolute inset-0 rounded-full bg-forest-900/60 backdrop-blur-md border border-harvest-400/40 shadow-[0_0_25px_rgba(245,197,66,0.4)] flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-12 h-12 text-harvest-400" fill="none">
                      {/* Stylized Bull Horns & Head SVG */}
                      <motion.path
                        d="M 22 35 C 18 20 28 12 40 18 C 36 28 34 36 34 44 C 34 54 42 62 50 62 C 58 62 66 54 66 44 C 66 36 64 28 60 18 C 72 12 82 20 78 35 C 72 32 68 34 66 38 C 66 58 58 76 50 82 C 42 76 34 58 34 38 C 32 34 28 32 22 35 Z"
                        stroke="#f5c542"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, fill: 'rgba(245, 197, 66, 0)' }}
                        animate={{ pathLength: 1, fill: 'rgba(245, 197, 66, 0.15)' }}
                        transition={{ duration: 1.8, ease: 'easeInOut' }}
                      />
                      {/* Leaf sprout in center */}
                      <motion.path
                        d="M 50 62 C 45 52 45 42 50 34 C 55 42 55 52 50 62 Z"
                        fill="#22c55e"
                        stroke="#22c55e"
                        strokeWidth="1.5"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* Animated Brand Name: Letters reveal one-by-one with golden shimmer */}
                <h1
                  className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-wider text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] relative flex flex-wrap justify-center items-center gap-x-1"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {letters.map((char, index) => (
                    <motion.span
                      key={`${char}-${index}`}
                      initial={{ opacity: 0, y: 28, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.35 + index * 0.05,
                        ease: [0.215, 0.61, 0.355, 1],
                      }}
                      className={
                        char === '_'
                          ? 'text-harvest-400 mx-0.5 inline-block opacity-80'
                          : 'inline-block text-shimmer hover:scale-105 transition-transform'
                      }
                    >
                      {char}
                    </motion.span>
                  ))}
                </h1>

                {/* Golden Accent Line */}
                <motion.div
                  className="h-[2px] bg-gradient-to-r from-transparent via-harvest-400 to-transparent my-4"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '240px', opacity: 1 }}
                  transition={{ duration: 1.2, delay: 1.1, ease: 'easeInOut' }}
                />

                {/* Tagline Reveal */}
                <motion.p
                  className="text-lg sm:text-2xl text-cream-100 font-medium tracking-widest uppercase drop-shadow-md flex items-center gap-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.3 }}
                >
                  <Sparkles className="w-4 h-4 text-harvest-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>From Our Farm to Your Home</span>
                  <Sparkles className="w-4 h-4 text-harvest-400 animate-spin" style={{ animationDuration: '8s' }} />
                </motion.p>
              </motion.div>
            ) : (
              /* Early visual teaser text during the first 3 seconds */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.9, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.8 }}
                className="text-center"
              >
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs sm:text-sm tracking-widest uppercase font-medium">
                  <span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse" />
                  Experience Authentic Rural Purity
                </span>
              </motion.div>
            )}
          </div>

          {/* Sleek Skip Button */}
          <motion.button
            onClick={handleSkip}
            className="absolute top-6 right-6 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 hover:bg-forest-900/80 text-white/90 hover:text-harvest-300 backdrop-blur-md border border-white/20 hover:border-harvest-400/50 transition-all text-xs sm:text-sm font-medium shadow-lg hover:shadow-[0_0_15px_rgba(245,197,66,0.3)] active:scale-95"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            aria-label="Skip cinematic introduction"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5" />
          </motion.button>
        </motion.div>
    </AnimatePresence>
  );
}
