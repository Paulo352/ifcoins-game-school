
import React from 'react';

interface CollectibleCardProps {
  card: {
    id: string;
    name: string;
    rarity: 'common' | 'rare' | 'legendary' | 'mythic';
    imageUrl: string;
    available: boolean;
    price: number;
    description: string;
  };
  quantity?: number;
  onClick?: () => void;
  className?: string;
}

const rarityConfig = {
  common: {
    bg: 'bg-gradient-to-br from-gray-100 to-gray-200',
    border: 'border-2 border-slate-400',
    text: 'text-slate-600',
    shadow: 'shadow-lg shadow-slate-200'
  },
  rare: {
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200',
    border: 'border-2 border-blue-500',
    text: 'text-blue-600',
    shadow: 'shadow-lg shadow-blue-200'
  },
  legendary: {
    bg: 'bg-gradient-to-br from-yellow-100 to-orange-200',
    border: 'border-2 border-amber-500',
    text: 'text-amber-600',
    shadow: 'shadow-lg shadow-amber-200'
  },
  mythic: {
    bg: 'bg-gradient-to-br from-purple-100 to-pink-200',
    border: 'border-2 border-violet-500',
    text: 'text-violet-600',
    shadow: 'shadow-lg shadow-violet-200'
  }
};

export function CollectibleCard({ card, quantity, onClick, className = '' }: CollectibleCardProps) {
  const config = rarityConfig[card.rarity];

  return (
    <div 
      className={`card-flip cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="card-inner">
        <div className={`card-front ${config.bg} ${config.border} ${config.shadow} p-4 h-full flex flex-col justify-between`}>
          <div>
            <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden">
              <img 
                src={card.imageUrl} 
                alt={card.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-sm text-center mb-2">{card.name}</h3>
            <div className={`text-xs text-center font-semibold ${config.text} uppercase`}>
              {card.rarity}
            </div>
          </div>
          {quantity && quantity > 1 && (
            <div className="absolute top-2 right-2 bg-ifpr-green text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {quantity}
            </div>
          )}
        </div>
        
        <div className={`card-back ${config.bg} ${config.border} ${config.shadow} p-4 h-full flex flex-col justify-center`}>
          <div className="text-center">
            <h3 className="font-bold text-sm mb-2">{card.name}</h3>
            <p className="text-xs text-gray-600 mb-3">{card.description}</p>
            <div className={`text-xs font-semibold ${config.text} uppercase`}>
              {card.rarity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
