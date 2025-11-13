
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Coins, Award, Calendar, Star, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { useTeacherDailyLimit } from '@/hooks/useTeacherDailyLimit';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useClasses, useClassStudents } from '@/hooks/useClasses';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface TeacherGiveCoinsFormProps {
  students: any[] | undefined;
  teacherId: string;
  onSuccess: () => void;
}

export function TeacherGiveCoinsForm({ students, teacherId, onSuccess }: TeacherGiveCoinsFormProps) {
  const [recipientType, setRecipientType] = useState<'individual' | 'class'>('individual');
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const [rewardType, setRewardType] = useState<'coins' | 'card'>('coins');
  const [selectedCardId, setSelectedCardId] = useState('');
  const { giveCoins, loading, calculateBonusCoins } = useUpdateCoins();
  const { dailyCoins, dailyLimit, remainingCoins, percentageUsed, refetch: refetchLimit } = useTeacherDailyLimit();
  const { activeEvent, multiplier, hasActiveEvent } = useActiveEvent();
  const queryClient = useQueryClient();
  const { data: classes } = useClasses();
  const { data: classStudents } = useClassStudents(selectedClassId);

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
    // Validações básicas
    if (!reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o motivo da recompensa",
        variant: "destructive"
      });
      return;
    }

    if (recipientType === 'individual' && !selectedStudentEmail) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um estudante",
        variant: "destructive"
      });
      return;
    }

    if (recipientType === 'class' && !selectedClassId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma turma",
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

    // Processar recompensa para turma
    if (recipientType === 'class') {
      if (!classStudents || classStudents.length === 0) {
        toast({
          title: "Turma vazia",
          description: "Não há alunos nesta turma",
          variant: "destructive"
        });
        return;
      }

      const totalAmount = parseInt(coinsAmount);
      if (totalAmount <= 0) {
        toast({
          title: "Quantidade inválida",
          description: "Informe uma quantidade válida de moedas",
          variant: "destructive"
        });
        return;
      }

      // Calcular moedas por aluno (dividir total e arredondar para cima)
      const coinsPerStudent = Math.ceil(totalAmount / classStudents.length);
      const finalCoinsPerStudent = calculateBonusCoins(coinsPerStudent);
      const totalCoinsToDistribute = finalCoinsPerStudent * classStudents.length;

      // Verificar limite diário
      const newTotal = dailyCoins + totalCoinsToDistribute;
      if (newTotal > dailyLimit) {
        toast({
          title: "Limite diário atingido",
          description: `Esta distribuição ultrapassaria seu limite diário (${newTotal}/${dailyLimit} moedas)`,
          variant: "destructive"
        });
        return;
      }

      // Dar moedas para cada aluno da turma
      let successCount = 0;
      for (const classStudent of classStudents) {
        const studentName = (classStudent as any).student?.name || 'Aluno';
        const success = await giveCoins(
          classStudent.student_id,
          coinsPerStudent,
          `${reason} (Turma)`,
          teacherId,
          studentName
        );
        if (success) successCount++;
      }

      if (successCount > 0) {
        toast({
          title: "Moedas distribuídas!",
          description: `${successCount} alunos receberam ${coinsPerStudent} moedas cada (${totalCoinsToDistribute} total)`,
        });
        setSelectedClassId('');
        setCoinsAmount('');
        setReason('');
        onSuccess();
        refetchLimit();
      }
      return;
    }

    // Processar recompensa individual
    const selectedStudent = students?.find(s => s.email === selectedStudentEmail);
    if (!selectedStudent) {
      toast({
        title: "Estudante não encontrado",
        description: "Verifique se o email está correto",
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

      // Registrar no reward_logs
      await supabase
        .from('reward_logs')
        .insert({
          student_id: selectedStudent.id,
          teacher_id: teacherId,
          coins: 0,
          reason: `Carta recebida: ${reason}`
        });

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
    <>
      {/* Card de destaque para turma */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-blue-900 mb-1">
                💡 Dar Moedas para Turma Inteira
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Você pode distribuir moedas para todos os alunos de uma turma de uma vez! O total será dividido igualmente entre os alunos.
              </p>
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <Star className="h-4 w-4" />
                <span>Exemplo: 300 moedas para 3 alunos = 100 moedas cada</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Label>Destinatário</Label>
            <RadioGroup value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer">Aluno Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="class" id="class" />
                <Label htmlFor="class" className="cursor-pointer flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Turma Inteira (dividir moedas)
                </Label>
              </div>
            </RadioGroup>
          </div>

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

          {recipientType === 'individual' ? (
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
          ) : (
            <div className="space-y-2">
              <Label>Selecionar Turma</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.description || 'Sem descrição'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClassId && classStudents && (
                <p className="text-xs text-muted-foreground">
                  📊 {classStudents.length} aluno(s) nesta turma
                </p>
              )}
            </div>
          )}

          {rewardType === 'coins' ? (
            <div className="space-y-2">
              <Label htmlFor="coins">
                {recipientType === 'class' ? 'Total de Moedas (será dividido)' : 'Quantidade de Moedas (1-50)'}
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
                max={recipientType === 'class' ? undefined : 50}
                placeholder={recipientType === 'class' ? '100' : '5'}
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
              />
              {recipientType === 'class' && selectedClassId && classStudents && coinsAmount && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Divisão:</strong> {Math.floor(parseInt(coinsAmount) / classStudents.length)} moedas por aluno
                    {hasActiveEvent && (
                      <span className="text-purple-600">
                        {' '}(com bônus: {calculateBonusCoins(Math.floor(parseInt(coinsAmount) / classStudents.length))} cada)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Total a distribuir: {calculateBonusCoins(Math.floor(parseInt(coinsAmount) / classStudents.length)) * classStudents.length} moedas
                  </p>
                </div>
              )}
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
    </>
  );
}
