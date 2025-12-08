
import React from 'react';
import ifcoinsIcon from '@/assets/ifcoins-icon.png';

interface CoinBalanceProps {
  balance: number;
  className?: string;
  showAnimation?: boolean;
}

export function CoinBalance({ balance, className = '', showAnimation = false }: CoinBalanceProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={ifcoinsIcon} 
        alt="IFCoins"
        className={`h-10 w-10 object-contain ${showAnimation ? 'animate-coin-flip' : ''}`} 
      />
      <span className="font-bold text-lg text-ifpr-green">
        {balance.toLocaleString('pt-BR')} IFCoins
      </span>
    </div>
  );
}
