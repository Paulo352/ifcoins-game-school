import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAwardBadge } from '@/hooks/quizzes/useCustomBadges';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AwardBadgeDialogProps {
  badge: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AwardBadgeDialog({ badge, open, onOpenChange }: AwardBadgeDialogProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const awardBadgeMutation = useAwardBadge();

  // Buscar alunos
  const { data: students } = useQuery({
    queryKey: ['students-for-badge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, class')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const handleAward = () => {
    if (!selectedStudent) return;

    awardBadgeMutation.mutate(
      {
        badgeId: badge.id,
        userId: selectedStudent,
        reason: reason || undefined
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedStudent('');
          setReason('');
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuir Badge: {badge.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Selecionar Aluno</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Escolha um aluno" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} {student.class ? `- Turma ${student.class}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Por que este aluno merece esta badge?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAward}
            disabled={!selectedStudent || awardBadgeMutation.isPending}
          >
            Atribuir Badge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
