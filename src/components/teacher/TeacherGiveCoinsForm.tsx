
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Award, Calendar, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { useTeacherDailyLimit } from '@/hooks/useTeacherDailyLimit';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

interface TeacherGiveCoinsFormProps {
  students: any[] | undefined;
  teacherId: string;
  onSuccess: () => void;
}

export function TeacherGiveCoinsForm({ students, teacherId, onSuccess }: TeacherGiveCoinsFormProps) {
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const [rewardType, setRewardType] = useState<'coins' | 'card'>('coins');
  const [selectedCardId, setSelectedCardId] = useState('');
  const { giveCoins, loading, calculateBonusCoins } = useUpdateCoins();
  const { dailyCoins, dailyLimit, remainingCoins, percentageUsed, refetch: refetchLimit } = useTeacherDailyLimit();
  const { activeEvent, multiplier, hasActiveEvent } = useActiveEvent();
  const queryClient = useQueryClient();

  const { data: cards } = useQuery({
    queryKey: ['available-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('available', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Escutar mudanças em reward_logs em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('teacher-reward-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reward_logs',
          filter: `teacher_id=eq.${teacherId}`,
        },
        (payload) => {
          console.log('🔄 Nova recompensa registrada:', payload);
          // Atualizar limite diário e estatísticas
          refetchLimit();
          queryClient.invalidateQueries({ queryKey: ['teacher-stats'] });
          queryClient.invalidateQueries({ queryKey: ['teacher-recent-rewards'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, refetchLimit, queryClient]);

  const handleGiveReward = async () => {
    if (!selectedStudentEmail || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    if (rewardType === 'coins' && !coinsAmount) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe a quantidade de moedas",
        variant: "destructive"
      });
      return;
    }

    if (rewardType === 'card' && !selectedCardId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma carta",
        variant: "destructive"
      });
      return;
    }

    const selectedStudent = students?.find(s => s.email === selectedStudentEmail);
    if (!selectedStudent) {
      toast({
        title: "Estudante não encontrado",
        variant: "destructive"
      });
      return;
    }

    if (rewardType === 'card') {
      // Dar carta
      const { error } = await supabase
        .from('user_cards')
        .insert({ user_id: selectedStudent.id, card_id: selectedCardId, quantity: 1 })
        .select()
        .single();

      if (error) {
        toast({ title: "Erro", description: "Não foi possível dar a carta", variant: "destructive" });
        return;
      }

      toast({ title: "Carta entregue!", description: `Carta dada para ${selectedStudent.name}` });
      setSelectedStudentEmail('');
      setReason('');
      setSelectedCardId('');
      onSuccess();
      return;
    }

    const amount = parseInt(coinsAmount);
    if (amount <= 0 || amount > 50) {
      toast({
        title: "Quantidade inválida",
        description: "Você pode dar entre 1 e 50 moedas por vez",
        variant: "destructive"
      });
      return;
    }

    // Verificar limite diário do professor
    const finalAmount = calculateBonusCoins(amount);
    const newTotal = dailyCoins + finalAmount;
    
    console.log('🔍 Verificando limite:', {
      dailyCoins,
      finalAmount,
      newTotal,
      dailyLimit,
      excedeLimite: newTotal > dailyLimit
    });
    
    if (newTotal > dailyLimit) {
      toast({
        title: "Limite diário atingido",
        description: `Você já distribuiu ${dailyCoins} de ${dailyLimit} moedas hoje. Esta ação ultrapassaria seu limite (${newTotal} moedas no total).`,
        variant: "destructive"
      });
      return;
    }

    const selectedStudent = students?.find(s => s.email === selectedStudentEmail);
    if (!selectedStudent) {
      toast({
        title: "Estudante não encontrado",
        description: "Verifique se o email está correto",
        variant: "destructive"
      });
      return;
    }

    const success = await giveCoins(
      selectedStudent.id, 
      amount, 
      reason, 
      teacherId, 
      selectedStudent.name
    );
    
    if (success) {
      setSelectedStudentEmail('');
      setCoinsAmount('');
      setReason('');
      onSuccess();
      refetchLimit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Atribuir Moedas IFCoins
        </CardTitle>
        <CardDescription>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>Recompense estudantes por bom comportamento e participação</span>
            <div className="flex gap-2">
              <Badge 
                variant={percentageUsed >= 100 ? "destructive" : percentageUsed >= 80 ? "secondary" : "outline"} 
                className="text-xs font-medium"
              >
                <Coins className="h-3 w-3 mr-1" />
                {dailyCoins}/{dailyLimit} hoje ({percentageUsed}%)
              </Badge>
              {hasActiveEvent && (
                <Badge variant="default" className="bg-purple-600 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Evento: {multiplier}x
                </Badge>
              )}
            </div>
          </div>
          {remainingCoins > 0 && remainingCoins <= dailyLimit * 0.2 && (
            <div className="mt-2 text-xs text-orange-600 font-medium">
              ⚠️ Restam apenas {remainingCoins} moedas do seu limite diário
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily Limit Warning */}
        {dailyCoins >= dailyLimit * 0.8 && (
          <div className={`p-3 border rounded-lg ${
            dailyCoins >= dailyLimit 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className={`flex items-center gap-2 ${
              dailyCoins >= dailyLimit ? 'text-red-700' : 'text-yellow-700'
            }`}>
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">
                {dailyCoins >= dailyLimit 
                  ? `Você atingiu o limite diário de ${dailyLimit} moedas!`
                  : `Atenção: Você já distribuiu ${dailyCoins} de ${dailyLimit} moedas hoje.`
                }
              </span>
            </div>
          </div>
        )}

        {/* Event Active Notice */}
        {hasActiveEvent && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Star className="h-4 w-4" />
              <span className="text-sm font-medium">
                Evento "{activeEvent?.name}" ativo - Bônus {multiplier}x aplicado automaticamente!
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Tipo de Recompensa</Label>
            <Select value={rewardType} onValueChange={(v: any) => setRewardType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coins">Moedas IFCoins</SelectItem>
                <SelectItem value="card">Carta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student">Email do Estudante</Label>
            <Input
              id="student"
              placeholder="estudante@estudantes.ifpr.edu.br"
              value={selectedStudentEmail}
              onChange={(e) => setSelectedStudentEmail(e.target.value)}
              list="students-list"
            />
            <datalist id="students-list">
              {students?.map((student) => (
                <option key={student.id} value={student.email}>
                  {student.name} - {student.email}
                </option>
              ))}
            </datalist>
          </div>

          {rewardType === 'coins' ? (
            <div className="space-y-2">
              <Label htmlFor="coins">
              Quantidade de Moedas (1-50)
              {hasActiveEvent && coinsAmount && (
                <span className="text-purple-600 font-medium ml-1">
                  → {calculateBonusCoins(parseInt(coinsAmount))} com bônus {multiplier}x
                </span>
              )}
            </Label>
            <Input
              id="coins"
              type="number"
              min="1"
              max="50"
              placeholder="5"
              value={coinsAmount}
              onChange={(e) => setCoinsAmount(e.target.value)}
            />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Selecionar Carta</Label>
              <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma carta" />
                </SelectTrigger>
                <SelectContent>
                  {cards?.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name} - {card.rarity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo da Recompensa</Label>
          <Textarea
            id="reason"
            placeholder="Ex: Participação ativa na aula de programação"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <Button 
          onClick={handleGiveReward}
          className="bg-ifpr-green hover:bg-ifpr-green-dark"
          disabled={loading || (rewardType === 'coins' && dailyCoins >= dailyLimit)}
        >
          <Coins className="h-4 w-4 mr-2" />
          {loading ? 'Processando...' : rewardType === 'coins' ? 'Atribuir Moedas' : 'Dar Carta'}
        </Button>
      </CardContent>
    </Card>
  );
}
