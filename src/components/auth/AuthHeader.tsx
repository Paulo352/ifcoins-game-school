
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ifcoinsIcon from '@/assets/ifcoins-icon.png';

export function AuthHeader() {
  return (
    <CardHeader className="text-center space-y-4">
      <div className="flex justify-center">
        <img 
          src={ifcoinsIcon} 
          alt="IFCoins"
          className="h-16 w-16 object-contain"
        />
      </div>
      <div>
        <CardTitle className="text-3xl font-bold text-primary">IFCoins</CardTitle>
        <CardDescription className="text-lg mt-2">
          Sistema Educacional Gamificado do IFPR
        </CardDescription>
      </div>
    </CardHeader>
  );
}
