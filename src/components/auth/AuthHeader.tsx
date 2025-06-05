
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Coins } from 'lucide-react';

export function AuthHeader() {
  return (
    <CardHeader className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="bg-green-600 text-white rounded-full p-4">
          <Coins className="h-8 w-8" />
        </div>
      </div>
      <div>
        <CardTitle className="text-3xl font-bold text-green-600">IFCoins</CardTitle>
        <CardDescription className="text-lg mt-2">
          Sistema Educacional Gamificado do IFPR
        </CardDescription>
      </div>
    </CardHeader>
  );
}
