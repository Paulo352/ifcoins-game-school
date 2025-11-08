import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizVictoryAnimationProps {
  isVisible: boolean;
  score: number;
  coinsEarned: number;
  onComplete?: () => void;
}

export function QuizVictoryAnimation({ 
  isVisible, 
  score, 
  coinsEarned,
  onComplete 
}: QuizVictoryAnimationProps) {
  
  useEffect(() => {
    if (isVisible && score >= 90) {
      // Golden confetti burst
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
        }
      };

      frame();
    }
  }, [isVisible, score, onComplete]);

  if (!isVisible || score < 90) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="relative"
        >
          {/* Glowing background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Main content */}
          <div className="relative bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 p-12 rounded-3xl shadow-2xl text-center border-4 border-yellow-400">
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                rotate: { duration: 2, ease: "linear", repeat: Infinity },
                scale: { duration: 1, repeat: Infinity, repeatDelay: 1 }
              }}
              className="mb-6 flex justify-center"
            >
              <Trophy className="h-32 w-32 text-yellow-600 dark:text-yellow-400 drop-shadow-lg" />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 mb-4"
            >
              Excelente!
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2"
            >
              Você acertou {score}%!
            </motion.p>

            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="text-3xl font-bold text-yellow-600 dark:text-yellow-400"
            >
              +{coinsEarned} IFCoins! 🎉
            </motion.p>

            {/* Sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: 360,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              >
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
