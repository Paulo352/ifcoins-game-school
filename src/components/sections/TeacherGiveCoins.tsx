import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Coins, AlertTriangle, Lightbulb, Ban } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { useTeacherDailyLimit } from '@/hooks/useTeacherDailyLimit';
import { Profile } from '@/types/supabase';

export function TeacherGiveCoins() {
  const { profile } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const { giveCoins, loading } = useUpdateCoins();
  const { dailyCoins, remainingCoins, canGiveSpecialCoins, limitReached, dailyLimit, refetch: refetchLimit } = useTeacherDailyLimit();

  const { data: students, refetch } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('name');
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: profile?.role === 'teacher',
  });

  const { data: recentRewards } = useQuery({
    queryKey: ['teacher-recent-special-rewards', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('reward_logs')
        .select(`
          *,
          student:profiles!reward_logs_student_id_fkey(name)
        `)
        .eq('teacher_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.role === 'teacher',
  });

  if (!profile || profile.role !== 'teacher') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-gray-600">Apenas professores podem acessar esta página.</p>
      </div>
    );
  }

  const handleGiveCoins = async () => {
    if (!selectedUserId || !coinsAmount || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para dar moedas",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(coinsAmount);
    if (amount <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    if (amount > 500) {
      toast({
        title: "Limite excedido",
        description: "Professores podem dar no máximo 500 moedas por vez",
        variant: "destructive"
      });
      return;
    }

    const selectedStudent = students?.find(s => s.id === selectedUserId);
    if (!selectedStudent) return;

    const success = await giveCoins(
      selectedUserId,
      amount,
      reason,
      profile.id,
      selectedStudent.name
    );

    if (success) {
      setSelectedUserId('');
      setCoinsAmount('');
      setReason('');
      refetch();
      refetchLimit();
    }
  };

  const selectedStudent = students?.find(s => s.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dar Moedas Especiais
        </h1>
        <p className="text-gray-600 mt-1">
          Para atividades extracurriculares e casos únicos (máximo 500 moedas)
        </p>
        <div className="flex items-center gap-4 mt-3">
          <Badge variant={limitReached ? "destructive" : "secondary"}>
            {dailyCoins}/{dailyLimit} moedas hoje
          </Badge>
          {limitReached && (
            <Badge variant="outline" className="text-red-600">
              <Ban className="h-3 w-3 mr-1" />
              Limite diário atingido
            </Badge>
          )}
        </div>
      </div>

      {/* Warning or Limit Notice */}
      {limitReached ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Limite Diário Atingido</h3>
                <p className="text-sm text-red-700 mt-1">
                  Você já deu {dailyLimit} moedas hoje. Para continuar dando recompensas, 
                  use apenas os motivos pré-definidos na seção "Gerenciar Estudantes".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900">Atenção - Casos Especiais</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Esta área é para recompensas especiais como atividades extracurriculares, 
                  projetos únicos ou situações excepcionais. Limite diário: {remainingCoins} moedas restantes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Dar Moedas Especiais
          </CardTitle>
          <CardDescription>
            Limite de 500 moedas por transação para professores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student">Estudante</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={limitReached}>
                <SelectTrigger>
                  <SelectValue placeholder={limitReached ? "Limite atingido" : "Selecione um estudante"} />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{student.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {student.coins} IFCoins
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coins">
                Quantidade de Moedas (máximo {Math.min(500, remainingCoins)})
              </Label>
              <Input
                id="coins"
                type="number"
                min="1"
                max={Math.min(500, remainingCoins)}
                placeholder="50"
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
                disabled={limitReached}
              />
              <p className="text-xs text-muted-foreground">
                {limitReached ? 'Limite diário atingido' : `Restam ${remainingCoins} moedas hoje`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo Especial</Label>
            <Textarea
              id="reason"
              placeholder={limitReached ? "Limite diário atingido" : "Ex: Participação excepcional na feira de ciências, projeto de extensão, representação da escola em evento externo..."}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={limitReached}
            />
            <p className="text-xs text-muted-foreground">
              {limitReached ? 'Use "Gerenciar Estudantes" para motivos pré-definidos' : 'Descreva detalhadamente o motivo especial desta recompensa'}
            </p>
          </div>

          {/* Preview */}
          {selectedStudent && coinsAmount && reason && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-900 mb-2">Preview da Recompensa</h4>
              <p className="text-sm text-green-700">
                <strong>{selectedStudent.name}</strong> receberá{' '}
                <strong>{coinsAmount} IFCoins</strong> por: <em>{reason}</em>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Saldo atual: {selectedStudent.coins} → Novo saldo: {selectedStudent.coins + parseInt(coinsAmount)}
              </p>
            </div>
          )}

          <Button 
            onClick={handleGiveCoins}
            disabled={loading || !selectedUserId || !coinsAmount || !reason || limitReached}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Coins className="h-4 w-4 mr-2" />
            {limitReached ? 'Limite Diário Atingido' : loading ? 'Processando...' : 'Dar Moedas Especiais'}
          </Button>
          
          {limitReached && (
            <p className="text-sm text-red-600 mt-2">
              Use a seção "Gerenciar Estudantes" para continuar dando recompensas com motivos pré-definidos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Quando usar esta funcionalidade?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">✅ Use para:</h4>
              <ul className="text-sm space-y-1 text-green-600">
                <li>• Atividades extracurriculares</li>
                <li>• Projetos de extensão</li>
                <li>• Representação em eventos</li>
                <li>• Conquistas excepcionais</li>
                <li>• Situações únicas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">📋 Use "Gerenciar Estudantes" para:</h4>
              <ul className="text-sm space-y-1 text-blue-600">
                <li>• Participação em aula</li>
                <li>• Entrega de tarefas</li>
                <li>• Bom comportamento</li>
                <li>• Ajuda aos colegas</li>
                <li>• Atividades do dia a dia</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Special Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Recompensas Especiais Recentes</CardTitle>
          <CardDescription>
            Suas últimas recompensas especiais entregues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRewards && recentRewards.length > 0 ? (
            <div className="space-y-3">
              {recentRewards.map((reward, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{reward.student?.name || 'Estudante'}</p>
                      <p className="text-sm text-muted-foreground mt-1">{reward.reason}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(reward.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      +{reward.coins} IFCoins
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma recompensa especial ainda</p>
              <p className="text-sm">Suas recompensas especiais aparecerão aqui</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}