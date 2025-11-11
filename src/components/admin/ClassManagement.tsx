import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useClasses, useClassStudents, useCreateClass, useAddStudentToClass, useRemoveStudentFromClass, useDeleteClass } from '@/hooks/useClasses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Trash, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export function ClassManagement() {
  const { data: classes, isLoading } = useClasses();
  const createClassMutation = useCreateClass();
  const deleteClassMutation = useDeleteClass();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', teacher_id: '' });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      return data;
    }
  });

  const handleCreate = () => {
    createClassMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setFormData({ name: '', description: '', teacher_id: '' });
      }
    });
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gerenciar Turmas</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Turma</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Turma</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Professor Responsável</Label>
                <Select value={formData.teacher_id} onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {teachers?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!formData.name}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes?.map((cls: any) => (
          <Card key={cls.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedClass(cls)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {cls.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{cls.description}</p>
              <p className="text-xs mt-2">Professor: {cls.teacher?.name || 'Não atribuído'}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={(e) => { e.stopPropagation(); deleteClassMutation.mutate(cls.id); }}>
                <Trash className="w-4 h-4 mr-2" />Deletar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedClass && <ClassStudentsDialog classData={selectedClass} onClose={() => setSelectedClass(null)} />}
    </div>
  );
}

function ClassStudentsDialog({ classData, onClose }: any) {
  const { data: students } = useClassStudents(classData.id);
  const addStudentMutation = useAddStudentToClass();
  const removeStudentMutation = useRemoveStudentFromClass();
  const [selectedStudent, setSelectedStudent] = useState('');

  const { data: allStudents } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
      return data;
    }
  });

  const availableStudents = allStudents?.filter(s => !students?.find((cs: any) => cs.student_id === s.id));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Alunos da Turma: {classData.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
              <SelectContent>
                {availableStudents?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              if (selectedStudent) {
                addStudentMutation.mutate({ classId: classData.id, studentId: selectedStudent });
                setSelectedStudent('');
              }
            }}>
              <UserPlus className="w-4 h-4 mr-2" />Adicionar
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {students?.map((cs: any) => (
              <div key={cs.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{cs.student.name}</p>
                  <p className="text-sm text-muted-foreground">{cs.student.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeStudentMutation.mutate({ classId: classData.id, studentId: cs.student_id })}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
