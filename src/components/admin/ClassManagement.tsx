import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useClasses, useClassStudents, useCreateClass, useAddStudentToClass, useRemoveStudentFromClass, useDeleteClass } from '@/hooks/useClasses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, Trash, UserPlus, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ClassManagement() {
  const { profile } = useAuth();
  const { data: classes, isLoading } = useClasses();
  const createClassMutation = useCreateClass();
  const deleteClassMutation = useDeleteClass();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    teacher_id: '',
    additional_teachers: [] as string[]
  });

  const isAdmin = profile?.role === 'admin';
  const isTeacher = profile?.role === 'teacher';

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
        setFormData({ 
          name: '', 
          description: '', 
          teacher_id: '',
          additional_teachers: []
        });
      }
    });
  };

  const toggleAdditionalTeacher = (teacherId: string) => {
    setFormData(prev => ({
      ...prev,
      additional_teachers: prev.additional_teachers.includes(teacherId)
        ? prev.additional_teachers.filter(id => id !== teacherId)
        : [...prev.additional_teachers, teacherId]
    }));
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Turmas</h2>
            <p className="text-muted-foreground">
              {isAdmin ? 'Crie turmas e gerencie professores e alunos' : 'Adicione alunos às suas turmas'}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Nova Turma</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Turma</DialogTitle>
                  <DialogDescription>
                    Configure a turma e escolha os professores responsáveis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome da Turma</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Turma 2024-A"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição da turma..."
                    />
                  </div>
                  <div>
                    <Label>Professor Responsável Principal</Label>
                    <Select value={formData.teacher_id} onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o professor principal" /></SelectTrigger>
                      <SelectContent>
                        {teachers?.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name} - {t.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-3 block">Professores Adicionais (Opcional)</Label>
                    <div className="space-y-2 border rounded-lg p-4 max-h-48 overflow-y-auto">
                      {teachers?.filter(t => t.id !== formData.teacher_id).map(teacher => (
                        <div key={teacher.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={teacher.id}
                            checked={formData.additional_teachers.includes(teacher.id)}
                            onCheckedChange={() => toggleAdditionalTeacher(teacher.id)}
                          />
                          <label htmlFor={teacher.id} className="text-sm cursor-pointer">
                            {teacher.name} - {teacher.email}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!formData.name || !formData.teacher_id}>
                    Criar Turma
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {isTeacher && !isAdmin && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Como professor, você pode adicionar alunos às turmas que você gerencia, mas não pode criar novas turmas.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes?.map((cls: any) => {
          const additionalTeachersCount = cls.additional_teachers?.length || 0;
          
          return (
            <Card key={cls.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedClass(cls)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {cls.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{cls.description}</p>
                <div className="text-xs space-y-1">
                  <p className="font-medium">Professor Principal:</p>
                  <p className="text-muted-foreground">{cls.teacher?.name || 'Não atribuído'}</p>
                  {additionalTeachersCount > 0 && (
                    <p className="text-muted-foreground mt-1">
                      +{additionalTeachersCount} professor(es) adicional(is)
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (confirm('Tem certeza que deseja deletar esta turma?')) {
                        deleteClassMutation.mutate(cls.id); 
                      }
                    }}
                  >
                    <Trash className="w-4 h-4 mr-2" />Deletar Turma
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedClass && <ClassStudentsDialog classData={selectedClass} onClose={() => setSelectedClass(null)} />}
    </div>
  );
}

function ClassStudentsDialog({ classData, onClose }: any) {
  const { profile } = useAuth();
  const { data: students } = useClassStudents(classData.id);
  const addStudentMutation = useAddStudentToClass();
  const removeStudentMutation = useRemoveStudentFromClass();
  const [selectedStudent, setSelectedStudent] = useState('');

  const isAdmin = profile?.role === 'admin';

  const { data: allStudents } = useQuery({
    queryKey: ['all-students'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'student');
      return data;
    }
  });

  const availableStudents = allStudents?.filter(s => !students?.find((cs: any) => cs.student_id === s.id));

  const additionalTeachersCount = classData.additional_teachers?.length || 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Turma: {classData.name}</DialogTitle>
          <DialogDescription>
            {classData.description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Teachers Info */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold mb-2">Professores da Turma</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Principal:</span> {classData.teacher?.name}</p>
              {additionalTeachersCount > 0 && (
                <p className="text-muted-foreground">+ {additionalTeachersCount} professor(es) adicional(is)</p>
              )}
            </div>
          </div>

          {/* Add Student Section */}
          <div className="space-y-2">
            <Label>Adicionar Aluno</Label>
            <div className="flex gap-2">
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger><SelectValue placeholder="Selecione um aluno para adicionar" /></SelectTrigger>
                <SelectContent>
                  {availableStudents?.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - {s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={() => {
                  if (selectedStudent) {
                    addStudentMutation.mutate({ classId: classData.id, studentId: selectedStudent });
                    setSelectedStudent('');
                  }
                }}
                disabled={!selectedStudent}
              >
                <UserPlus className="w-4 h-4 mr-2" />Adicionar
              </Button>
            </div>
          </div>
          
          {/* Students List */}
          <div className="space-y-2">
            <Label>Alunos ({students?.length || 0})</Label>
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
              {students && students.length > 0 ? (
                students.map((cs: any) => (
                  <div key={cs.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="font-medium">{cs.student.name}</p>
                      <p className="text-sm text-muted-foreground">{cs.student.email}</p>
                      {cs.student.class && (
                        <p className="text-xs text-muted-foreground">Turma: {cs.student.class}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          if (confirm(`Remover ${cs.student.name} da turma?`)) {
                            removeStudentMutation.mutate({ classId: classData.id, studentId: cs.student_id });
                          }
                        }}
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum aluno adicionado ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
