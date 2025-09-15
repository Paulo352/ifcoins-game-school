
import React, { useState } from 'react';
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

interface TeacherGiveCoinsFormProps {
  students: any[] | undefined;
  teacherId: string;
  onSuccess: () => void;
}

export function TeacherGiveCoinsForm({ students, teacherId, onSuccess }: TeacherGiveCoinsFormProps) {
  const [selectedStudentEmail, setSelectedStudentEmail] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const { giveCoins, loading, calculateBonusCoins } = useUpdateCoins();
  const { dailyCoins, dailyLimit, refetch: refetchLimit } = useTeacherDailyLimit();
  const { activeEvent, multiplier, hasActiveEvent } = useActiveEvent();

  const handleGiveCoins = async () => {
    if (!selectedStudentEmail || !coinsAmount || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para dar moedas",
        variant: "destructive"
      });
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
        <CardDescription className="flex items-center justify-between">
          <span>Recompense estudantes por bom comportamento e participação</span>
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {dailyCoins}/{dailyLimit} moedas hoje
            </Badge>
            {hasActiveEvent && (
              <Badge variant="default" className="bg-purple-600 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Evento: {multiplier}x
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
                Evento "{activeEvent?.name}" ativo - Bônus {multiplier}x aplicado automaticamente!
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          onClick={handleGiveCoins}
          className="bg-ifpr-green hover:bg-ifpr-green-dark"
          disabled={loading}
        >
          <Coins className="h-4 w-4 mr-2" />
          {loading ? 'Atribuindo Moedas...' : 'Atribuir Moedas'}
        </Button>
      </CardContent>
    </Card>
  );
}
