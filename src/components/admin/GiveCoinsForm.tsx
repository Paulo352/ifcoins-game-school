import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Coins, Calendar, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { Profile } from '@/types/supabase';

interface GiveCoinsFormProps {
  users: Profile[] | undefined;
  onSuccess: () => void;
}

export function GiveCoinsForm({ users, onSuccess }: GiveCoinsFormProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const { giveCoins, loading, calculateBonusCoins } = useUpdateCoins();
  const { activeEvent, multiplier, hasActiveEvent } = useActiveEvent();

  const handleGiveCoins = async () => {
    if (!selectedUser || !coinsAmount || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para dar/retirar moedas",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(coinsAmount);
    if (amount === 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser diferente de zero",
        variant: "destructive"
      });
      return;
    }

    const selectedUserName = users?.find(u => u.id === selectedUser)?.name || 'Usuário';
    
    const success = await giveCoins(selectedUser, amount, reason, 'admin', selectedUserName);
    
    if (success) {
      setSelectedUser('');
      setCoinsAmount('');
      setReason('');
      onSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Creditar Moedas IFCoins
        </CardTitle>
        <CardDescription>
          <div className="flex items-center justify-between">
            <span>Recompense usuários com moedas IFCoins</span>
            {hasActiveEvent && (
              <Badge variant="default" className="bg-purple-600">
                <Calendar className="h-3 w-3 mr-1" />
                Evento: {activeEvent?.name} ({multiplier}x)
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Active Notice */}
        {hasActiveEvent && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">
                Evento "{activeEvent?.name}" ativo - Bônus {multiplier}x aplicado automaticamente em valores positivos!
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.role} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coins">
              Quantidade de Moedas
              {hasActiveEvent && coinsAmount && parseInt(coinsAmount) > 0 && (
                <span className="text-purple-600 font-medium ml-1">
                  → {calculateBonusCoins(parseInt(coinsAmount))} com bônus {multiplier}x
                </span>
              )}
            </Label>
            <Input
              id="coins"
              type="number"
              placeholder="100 (use valores negativos para retirar)"
              value={coinsAmount}
              onChange={(e) => setCoinsAmount(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Use valores positivos para dar moedas ou negativos para retirar
              {hasActiveEvent && (
                <span className="text-purple-600"> • Bônus {multiplier}x aplicado em valores positivos</span>
              )}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            placeholder="Ex: Recompensa por projeto especial ou Remoção por violação das regras"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <Button 
          onClick={handleGiveCoins}
          className="bg-primary hover:bg-primary/90"
          disabled={loading}
        >
          <Coins className="h-4 w-4 mr-2" />
          {loading ? 'Processando...' : 'Creditar Moedas'}
        </Button>
      </CardContent>
    </Card>
  );
}