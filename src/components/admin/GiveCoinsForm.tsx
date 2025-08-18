
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { Profile } from '@/types/supabase';

interface GiveCoinsFormProps {
  users: Profile[] | undefined;
  teacherId: string;
  onSuccess: () => void;
}

export function GiveCoinsForm({ users, teacherId, onSuccess }: GiveCoinsFormProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const { giveCoins, loading } = useUpdateCoins();

  const handleGiveCoins = async () => {
    if (!selectedUser || !coinsAmount || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para dar moedas",
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
    
    const success = await giveCoins(selectedUser, amount, reason, teacherId, selectedUserName);
    
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
          Dar Moedas IFCoins
        </CardTitle>
        <CardDescription>
          Recompense estudantes e professores por bom desempenho
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Label htmlFor="coins">Quantidade de Moedas</Label>
            <Input
              id="coins"
              type="number"
              placeholder="100 (use valores negativos para retirar)"
              value={coinsAmount}
              onChange={(e) => setCoinsAmount(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Como admin, você pode dar qualquer quantidade ou usar valores negativos para retirar moedas
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo da Recompensa</Label>
          <Textarea
            id="reason"
            placeholder="Ex: Excelente participação no projeto de pesquisa"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <Button 
          onClick={handleGiveCoins}
          className="bg-ifpr-green hover:bg-ifpr-green-dark"
          disabled={loading}
        >
          <Coins className="h-4 w-4 mr-2" />
          {loading ? 'Dando Moedas...' : 'Dar Moedas'}
        </Button>
      </CardContent>
    </Card>
  );
}
