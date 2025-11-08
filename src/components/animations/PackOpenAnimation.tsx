import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface Card {
  card_id: string;
  name: string;
  rarity: string;
  quantity: number;
  image_url?: string;
}

interface PackOpenAnimationProps {
  isOpen: boolean;
  packName: string;
  cards: Card[];
  onClose: () => void;
}

export function PackOpenAnimation({ isOpen, packName, cards, onClose }: PackOpenAnimationProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(-1);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    if (isOpen && cards.length > 0) {
      // Reset state
      setCurrentCardIndex(-1);
      setShowAllCards(false);

      // Trigger confetti after a delay
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);

      // Start revealing cards
      setTimeout(() => {
        setCurrentCardIndex(0);
      }, 1000);
    }
  }, [isOpen, cards]);

  useEffect(() => {
    if (currentCardIndex >= 0 && currentCardIndex < cards.length - 1) {
      const timer = setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (currentCardIndex === cards.length - 1) {
      setTimeout(() => {
        setShowAllCards(true);
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 }
        });
      }, 1500);
    }
  }, [currentCardIndex, cards.length]);

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'mythic': return 'from-purple-600 via-pink-600 to-red-600';
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500';
      case 'rare': return 'from-blue-500 via-cyan-500 to-teal-500';
      case 'common': return 'from-gray-400 via-gray-500 to-gray-600';
      default: return 'from-gray-400 via-gray-500 to-gray-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Animated background particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight,
                  scale: 0
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {!showAllCards ? (
            // Single card reveal animation
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotateY: 0 }}
                animate={{ scale: 1, rotateY: 360 }}
                transition={{ duration: 1, type: "spring" }}
                className="text-center mb-8"
              >
                <h2 className="text-4xl font-bold text-white mb-2">{packName}</h2>
                <Sparkles className="h-8 w-8 text-yellow-400 mx-auto animate-pulse" />
              </motion.div>

              <AnimatePresence mode="wait">
                {currentCardIndex >= 0 && currentCardIndex < cards.length && (
                  <motion.div
                    key={currentCardIndex}
                    initial={{ rotateY: -180, scale: 0.5, opacity: 0 }}
                    animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                    exit={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="relative"
                  >
                    <div className={`w-80 h-[480px] rounded-xl bg-gradient-to-br ${getRarityColor(cards[currentCardIndex].rarity)} p-1 shadow-2xl`}>
                      <div className="w-full h-full bg-card rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Card glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                          animate={{
                            opacity: [0.5, 1, 0.5]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        {cards[currentCardIndex].image_url && (
                          <img 
                            src={cards[currentCardIndex].image_url} 
                            alt={cards[currentCardIndex].name}
                            className="w-48 h-48 object-cover rounded-lg mb-4 shadow-xl"
                          />
                        )}
                        <h3 className="text-2xl font-bold text-foreground mb-2 z-10">
                          {cards[currentCardIndex].name}
                        </h3>
                        <span className={`px-4 py-2 rounded-full text-white font-semibold text-sm z-10 bg-gradient-to-r ${getRarityColor(cards[currentCardIndex].rarity)}`}>
                          {cards[currentCardIndex].rarity.toUpperCase()}
                        </span>
                        {cards[currentCardIndex].quantity > 1 && (
                          <span className="mt-2 text-lg font-bold text-primary z-10">
                            x{cards[currentCardIndex].quantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // All cards display
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-6xl w-full"
            >
              <h2 className="text-4xl font-bold text-white mb-8">
                Cartas Obtidas!
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {cards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-lg bg-gradient-to-br ${getRarityColor(card.rarity)} p-0.5`}
                  >
                    <div className="bg-card rounded-lg p-4 h-full">
                      {card.image_url && (
                        <img 
                          src={card.image_url} 
                          alt={card.name}
                          className="w-full aspect-square object-cover rounded mb-2"
                        />
                      )}
                      <h4 className="font-semibold text-sm mb-1">{card.name}</h4>
                      <span className="text-xs text-muted-foreground">{card.rarity}</span>
                      {card.quantity > 1 && (
                        <span className="block text-xs font-bold text-primary mt-1">
                          x{card.quantity}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button 
                onClick={onClose}
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Continuar Explorando
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
