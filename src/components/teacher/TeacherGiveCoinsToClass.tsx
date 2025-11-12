import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useTeacherDailyLimit } from '@/hooks/useTeacherDailyLimit';

export function TeacherGiveCoinsToClass() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const limit = useTeacherDailyLimit();
  const [selectedClass, setSelectedClass] = useState('');
  const [coinsPerStudent, setCoinsPerStudent] = useState('10');
  const [reason, setReason] = useState('');

  // Buscar turmas do professor
  const { data: classes = [] } = useQuery({
    queryKey: ['teacher-classes', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .or(`teacher_id.eq.${profile.id},created_by.eq.${profile.id},additional_teachers.cs.{${profile.id}}`);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile && profile.role === 'teacher'
  });

  // Buscar alunos da turma selecionada
  const { data: students = [] } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
      const { data, error } = await supabase
        .from('class_students')
        .select('student_id, student:profiles!class_students_student_id_fkey(id, name)')
        .eq('class_id', selectedClass);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass
  });

  // Mutação para distribuir moedas
  const distributeCoinsMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !selectedClass || !reason.trim()) {
        throw new Error('Dados incompletos');
      }

      const coins = parseInt(coinsPerStudent);
      if (isNaN(coins) || coins <= 0) {
        throw new Error('Valor de moedas inválido');
      }

      const totalCoins = coins * students.length;
      
      // Verificar limite diário
      if (limit && totalCoins > limit.remainingCoins) {
        throw new Error(`Limite diário insuficiente. Você pode dar até ${limit.remainingCoins} moedas hoje.`);
      }

      // Distribuir moedas para cada aluno usando update_user_coins RPC
      const results = await Promise.all(
        students.map(async (student) => {
          // Atualizar moedas do aluno via RPC
          const { error: rpcError } = await supabase.rpc('update_user_coins', {
            user_id: student.student_id,
            amount: coins
          });

          if (rpcError) throw rpcError;

          // Registrar log
          const { error: logError } = await supabase
            .from('reward_logs')
            .insert({
              teacher_id: profile.id,
              student_id: student.student_id,
              coins: coins,
              reason: `[Turma] ${reason}`
            });

          if (logError) throw logError;

          return { success: true };
        })
      );

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-recent-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-daily-limit'] });
      toast.success(`${coinsPerStudent} moedas distribuídas para ${students.length} alunos!`);
      setReason('');
      setCoinsPerStudent('10');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao distribuir moedas');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    distributeCoinsMutation.mutate();
  };

  const totalCoins = parseInt(coinsPerStudent) * students.length || 0;

  if (!profile || profile.role !== 'teacher') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Premiar Turma Inteira
        </CardTitle>
        <CardDescription>
          Distribua moedas igualmente para todos os alunos de uma turma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Selecione a Turma</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma turma" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {students.length > 0 && (
            <>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>{students.length}</strong> alunos nesta turma
                </p>
              </div>

              <div>
                <Label>Moedas por Aluno</Label>
                <Input
                  type="number"
                  min="1"
                  max={limit ? Math.floor(limit.remainingCoins / students.length) : 50}
                  value={coinsPerStudent}
                  onChange={(e) => setCoinsPerStudent(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>Motivo</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Excelente participação na aula de hoje"
                  required
                  rows={3}
                />
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total a distribuir:</span>
                  <span className="text-2xl font-bold text-primary flex items-center gap-1">
                    <Coins className="w-5 h-5" />
                    {totalCoins}
                  </span>
                </div>
                {limit && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Limite disponível hoje: {limit.remainingCoins} moedas
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={distributeCoinsMutation.isPending || !reason.trim() || totalCoins > (limit?.remainingCoins || 0)}
              >
                {distributeCoinsMutation.isPending 
                  ? 'Distribuindo...' 
                  : `Distribuir ${totalCoins} Moedas`
                }
              </Button>
            </>
          )}

          {!selectedClass && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Selecione uma turma para começar
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
