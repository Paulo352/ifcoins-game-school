import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Coins, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { useTeacherDailyLimit } from '@/hooks/useTeacherDailyLimit';
import { Profile } from '@/types/supabase';

interface TeacherGiveCoinsSection {
  users: Profile[] | undefined;
  teacherId: string;
  onSuccess: () => void;
}

const PREDEFINED_REASONS = [
  { reason: 'Participação ativa na aula', coins: 10 },
  { reason: 'Ajudou um colega', coins: 15 },
  { reason: 'Entregou tarefa no prazo', coins: 5 },
  { reason: 'Excelente comportamento', coins: 8 },
  { reason: 'Criatividade na atividade', coins: 12 },
  { reason: 'Liderança em grupo', coins: 20 },
  { reason: 'Melhoria significativa', coins: 25 },
  { reason: 'Presença perfeita na semana', coins: 30 },
  { reason: 'Projeto excepcional', coins: 50 },
  { reason: 'Representou bem a escola', coins: 40 },
];

export function TeacherGiveCoinsSection({ users, teacherId, onSuccess }: TeacherGiveCoinsSection) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const { giveCoins, loading } = useUpdateCoins();
  const { dailyCoins, dailyLimit, remainingCoins, percentageUsed, refetch: refetchLimit } = useTeacherDailyLimit();

  const studentUsers = users?.filter(u => u.role === 'student') || [];
  const selectedReasonData = PREDEFINED_REASONS.find(r => r.reason === selectedReason);

  const handleGiveCoins = async () => {
    if (!selectedUserId || !selectedReason || !selectedReasonData) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um estudante e um motivo",
        variant: "destructive",
      });
      return;
    }

    // Verificar limite diário ANTES de dar as moedas
    const newTotal = dailyCoins + selectedReasonData.coins;
    if (newTotal > dailyLimit) {
      toast({
        title: "Limite diário atingido",
        description: `Você já distribuiu ${dailyCoins} de ${dailyLimit} moedas hoje. Esta ação ultrapassaria seu limite (${newTotal} moedas no total).`,
        variant: "destructive",
      });
      return;
    }

    const selectedUserName = studentUsers.find(u => u.id === selectedUserId)?.name || 'Estudante';
    
    const success = await giveCoins(
      selectedUserId, 
      selectedReasonData.coins, 
      selectedReasonData.reason, 
      teacherId, 
      selectedUserName
    );
    
    if (success) {
      setSelectedUserId('');
      setSelectedReason('');
      onSuccess();
      refetchLimit();
      toast({
        title: "Recompensa entregue!",
        description: `${selectedUserName} recebeu ${selectedReasonData.coins} IFCoins por: ${selectedReasonData.reason}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Recompensar Estudante
        </CardTitle>
        <CardDescription>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>Use motivos pré-definidos para recompensas rápidas e consistentes</span>
            <Badge 
              variant={percentageUsed >= 100 ? "destructive" : percentageUsed >= 80 ? "secondary" : "outline"}
              className="text-xs font-medium"
            >
              <Coins className="h-3 w-3 mr-1" />
              {dailyCoins}/{dailyLimit} hoje ({percentageUsed}%)
            </Badge>
          </div>
          {remainingCoins > 0 && remainingCoins <= dailyLimit * 0.2 && (
            <div className="mt-2 text-xs text-orange-600 font-medium">
              ⚠️ Restam apenas {remainingCoins} moedas do seu limite diário
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Estudante</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um estudante" />
              </SelectTrigger>
              <SelectContent>
                {studentUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{user.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {user.coins} moedas
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo da Recompensa</label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_REASONS.map((item, index) => (
                  <SelectItem key={index} value={item.reason}>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm">{item.reason}</span>
                      <Badge variant="secondary" className="ml-2 text-green-600">
                        +{item.coins}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        {selectedUserId && selectedReasonData && (
          <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Resumo da Recompensa</span>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>{studentUsers.find(u => u.id === selectedUserId)?.name}</strong> receberá{' '}
              <strong className="text-green-600">{selectedReasonData.coins} IFCoins</strong> por:{' '}
              <em>{selectedReasonData.reason}</em>
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleGiveCoins} 
            disabled={loading || !selectedUserId || !selectedReason || dailyCoins >= dailyLimit}
            className="bg-green-600 hover:bg-green-700"
          >
            <Coins className="h-4 w-4 mr-2" />
            {dailyCoins >= dailyLimit 
              ? 'Limite Diário Atingido' 
              : loading 
                ? 'Dando...' 
                : 'Dar Recompensa'
            }
          </Button>
          
          {(selectedUserId || selectedReason) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedUserId('');
                setSelectedReason('');
              }}
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Aviso de Limite Diário */}
        {dailyCoins >= dailyLimit * 0.9 && dailyCoins < dailyLimit && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 font-medium">
              ⚠️ <strong>Atenção:</strong> Você está próximo do limite diário ({dailyCoins}/{dailyLimit} moedas usadas).
            </p>
          </div>
        )}
        
        {dailyCoins >= dailyLimit && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              🚫 <strong>Limite Atingido:</strong> Você já distribuiu todas as {dailyLimit} moedas disponíveis hoje. 
              O limite será resetado à meia-noite.
            </p>
          </div>
        )}
        
        {/* Info */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Dica:</strong> O limite diário é configurado pelo administrador e se aplica a todos os professores. 
            As moedas dadas contam para este limite.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}