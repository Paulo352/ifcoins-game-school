import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Coins, Calendar, Star, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { useActiveEvent } from '@/hooks/useActiveEvent';
import { useClasses, useClassStudents } from '@/hooks/useClasses';
import { Profile } from '@/types/supabase';

interface GiveCoinsFormProps {
  users: Profile[] | undefined;
  onSuccess: () => void;
}

export function GiveCoinsForm({ users, onSuccess }: GiveCoinsFormProps) {
  const [recipientType, setRecipientType] = useState<'individual' | 'class'>('individual');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const { giveCoins, loading, calculateBonusCoins } = useUpdateCoins();
  const { activeEvent, multiplier, hasActiveEvent } = useActiveEvent();
  const { data: classes } = useClasses();
  const { data: classStudents } = useClassStudents(selectedClassId);

  const handleGiveCoins = async () => {
    // Validações básicas
    if (!reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe o motivo da recompensa",
        variant: "destructive"
      });
      return;
    }

    if (recipientType === 'individual' && !selectedUser) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um usuário",
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

    if (!coinsAmount) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe a quantidade de moedas",
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
      if (totalAmount === 0) {
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

      // Dar moedas para cada aluno da turma
      let successCount = 0;
      for (const classStudent of classStudents) {
        const studentName = (classStudent as any).student?.name || 'Aluno';
        const success = await giveCoins(
          classStudent.student_id,
          coinsPerStudent,
          `${reason} (Turma)`,
          'admin',
          studentName
        );
        if (success) successCount++;
      }

      if (successCount > 0) {
        toast({
          title: "Moedas distribuídas!",
          description: `${successCount} alunos receberam ${finalCoinsPerStudent} moedas cada (${totalCoinsToDistribute} total)`,
        });
        setSelectedClassId('');
        setCoinsAmount('');
        setReason('');
        onSuccess();
      }
      return;
    }

    // Processar recompensa individual
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

        <div className="space-y-4">
          <div>
            <Label>Destinatário</Label>
            <RadioGroup value={recipientType} onValueChange={(v: any) => setRecipientType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="cursor-pointer">Usuário Individual</Label>
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

          {recipientType === 'individual' ? (
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

          <div className="space-y-2">
            <Label htmlFor="coins">
              {recipientType === 'class' ? 'Total de Moedas (será dividido)' : 'Quantidade de Moedas'}
              {hasActiveEvent && coinsAmount && parseInt(coinsAmount) > 0 && (
                <span className="text-purple-600 font-medium ml-1">
                  → {calculateBonusCoins(parseInt(coinsAmount))} com bônus {multiplier}x
                </span>
              )}
            </Label>
            <Input
              id="coins"
              type="number"
              placeholder={recipientType === 'class' ? 'Ex: 300' : '100 (use valores negativos para retirar)'}
              value={coinsAmount}
              onChange={(e) => setCoinsAmount(e.target.value)}
            />
            {recipientType === 'class' && selectedClassId && classStudents && coinsAmount && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Divisão:</strong> {Math.ceil(parseInt(coinsAmount) / classStudents.length)} moedas por aluno
                  {hasActiveEvent && (
                    <span className="text-purple-600">
                      {' '}(com bônus: {calculateBonusCoins(Math.ceil(parseInt(coinsAmount) / classStudents.length))} cada)
                    </span>
                  )}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Total a distribuir: {calculateBonusCoins(Math.ceil(parseInt(coinsAmount) / classStudents.length)) * classStudents.length} moedas
                </p>
              </div>
            )}
            {recipientType === 'individual' && (
              <p className="text-xs text-gray-500">
                Use valores positivos para dar moedas ou negativos para retirar
                {hasActiveEvent && (
                  <span className="text-purple-600"> • Bônus {multiplier}x aplicado em valores positivos</span>
                )}
              </p>
            )}
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