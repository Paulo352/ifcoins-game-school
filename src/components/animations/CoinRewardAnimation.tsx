import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { Coins } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoinRewardAnimationProps {
  isVisible: boolean;
  amount: number;
  message?: string;
  onComplete?: () => void;
}

export function CoinRewardAnimation({ 
  isVisible, 
  amount, 
  message,
  onComplete 
}: CoinRewardAnimationProps) {
  
  useEffect(() => {
    if (isVisible) {
      // Trigger coin confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 500);
          }
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -50 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 text-white px-8 py-6 rounded-2xl shadow-2xl text-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5, 
                repeat: 3,
                repeatDelay: 0.3
              }}
              className="mb-4 flex justify-center"
            >
              <Coins className="h-20 w-20" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-2"
            >
              +{amount} IFCoins!
            </motion.h2>
            
            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl font-semibold"
              >
                {message}
              </motion.p>
            )}
          </motion.div>

          {/* Floating coins animation */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 50,
                scale: 0,
                rotate: 0
              }}
              animate={{
                y: -100,
                scale: [0, 1, 1, 0],
                rotate: 360,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: Math.random() * 0.5,
                ease: "easeOut"
              }}
            >
              <Coins className="h-8 w-8 text-yellow-400" />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
