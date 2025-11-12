import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Star, Award, BookOpen, CheckCircle, XCircle, Clock, Coins, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  useMentorships, 
  useAvailableMentors, 
  useRequestMentorship, 
  useUpdateMentorshipStatus,
  useMentorshipActivities,
  useCreateMentorshipActivity 
} from '@/hooks/useMentorship';

export function Mentorship() {
  const { profile } = useAuth();
  const { data: mentorships, isLoading } = useMentorships();
  const { data: availableMentors } = useAvailableMentors();
  const requestMentorship = useRequestMentorship();
  const updateStatus = useUpdateMentorshipStatus();
  const createActivity = useCreateMentorshipActivity();

  const [selectedMentor, setSelectedMentor] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedMentorship, setSelectedMentorship] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    activityType: 'session',
    description: '',
    coinsEarned: 10,
  });
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  const handleRequestMentorship = async () => {
    if (!selectedMentor) return;
    await requestMentorship.mutateAsync({ mentorId: selectedMentor });
    setDialogOpen(false);
    setSelectedMentor('');
  };

  const handleStatusUpdate = async (mentorshipId: string, status: string) => {
    await updateStatus.mutateAsync({ mentorshipId, status });
  };

  const handleCreateActivity = async () => {
    if (!selectedMentorship) return;
    await createActivity.mutateAsync({
      mentorshipId: selectedMentorship,
      ...activityForm,
    });
    setActivityDialogOpen(false);
    setActivityForm({ activityType: 'session', description: '', coinsEarned: 10 });
  };

  const handleSubmitReview = async () => {
    if (!selectedMentorship) return;
    
    try {
      const { error } = await supabase
        .from('mentorship_reviews')
        .insert({
          mentorship_id: selectedMentorship,
          reviewer_id: profile?.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso!');
      setReviewDialogOpen(false);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error(error.message || 'Erro ao enviar avaliação');
    }
  };

  const activeMentorships = mentorships?.filter(m => m.status === 'active') || [];
  const pendingMentorships = mentorships?.filter(m => m.status === 'pending') || [];
  const isMentor = profile?.role === 'student' && activeMentorships.some(m => m.mentor_id === profile?.id);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: 'Pendente', icon: Clock },
      active: { variant: 'default', label: 'Ativa', icon: CheckCircle },
      completed: { variant: 'outline', label: 'Concluída', icon: Award },
      cancelled: { variant: 'destructive', label: 'Cancelada', icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (!profile || profile.role !== 'student') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sistema de mentoria disponível apenas para alunos.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Mentoria</h1>
          <p className="text-muted-foreground mt-1">
            Alunos avançados ajudam iniciantes e ganham recompensas
          </p>
        </div>
        
        {!isMentor && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Users className="h-4 w-4" />
                Solicitar Mentor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Mentoria</DialogTitle>
                <DialogDescription>
                  Escolha um aluno avançado para ser seu mentor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mentor Disponível</Label>
                  <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um mentor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMentors?.map((mentor) => (
                        <SelectItem key={mentor.id} value={mentor.id}>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {mentor.name} ({mentor.coins} IFCoins)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRequestMentorship} disabled={!selectedMentor} className="w-full">
                  Enviar Solicitação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mentorias Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMentorships.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Solicitações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMentorships.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isMentor ? 'Mentor Ativo' : 'Aprendiz'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Solicitações Pendentes */}
      {pendingMentorships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Solicitações Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingMentorships.map((mentorship) => {
                const iAmMentor = mentorship.mentor_id === profile?.id;
                const otherPerson = iAmMentor ? mentorship.mentee : mentorship.mentor;
                
                return (
                  <div key={mentorship.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{otherPerson?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {iAmMentor ? 'Solicitou mentoria com você' : 'Aguardando resposta'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {iAmMentor && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(mentorship.id, 'active')}
                          >
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(mentorship.id, 'cancelled')}
                          >
                            Recusar
                          </Button>
                        </>
                      )}
                      {getStatusBadge(mentorship.status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentorias Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Minhas Mentorias
          </CardTitle>
          <CardDescription>
            Mentorias ativas e histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mentorships && mentorships.length > 0 ? (
            <div className="space-y-4">
              {mentorships.map((mentorship) => {
                const iAmMentor = mentorship.mentor_id === profile?.id;
                const otherPerson = iAmMentor ? mentorship.mentee : mentorship.mentor;
                
                return (
                  <div key={mentorship.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          iAmMentor ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {iAmMentor ? <Star className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium">{otherPerson?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {iAmMentor ? 'Seu mentorado' : 'Seu mentor'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(mentorship.status)}
                        {iAmMentor && mentorship.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMentorship(mentorship.id);
                              setActivityDialogOpen(true);
                            }}
                          >
                            <Coins className="h-4 w-4 mr-1" />
                            Registrar Atividade
                          </Button>
                        )}
                        {!iAmMentor && mentorship.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMentorship(mentorship.id);
                              setReviewDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Avaliar
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <MentorshipActivitiesPreview mentorshipId={mentorship.id} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma mentoria ainda</p>
              <p className="text-sm">Solicite um mentor para começar!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para registrar atividade */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Atividade de Mentoria</DialogTitle>
            <DialogDescription>
              Registre uma atividade e ganhe moedas pela mentoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Atividade</Label>
              <Select 
                value={activityForm.activityType} 
                onValueChange={(v) => setActivityForm({ ...activityForm, activityType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Sessão de Estudos</SelectItem>
                  <SelectItem value="help">Ajuda com Exercícios</SelectItem>
                  <SelectItem value="quiz_support">Suporte em Quiz</SelectItem>
                  <SelectItem value="study_session">Grupo de Estudos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Descreva a atividade realizada..."
              />
            </div>

            <div className="space-y-2">
              <Label>Moedas Ganhas</Label>
              <Input
                type="number"
                value={activityForm.coinsEarned}
                onChange={(e) => setActivityForm({ ...activityForm, coinsEarned: parseInt(e.target.value) })}
                min={5}
                max={50}
              />
              <p className="text-xs text-muted-foreground">
                Ganhe entre 5 e 50 moedas por atividade
              </p>
            </div>

            <Button onClick={handleCreateActivity} className="w-full">
              Registrar Atividade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para avaliar mentoria */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Mentoria</DialogTitle>
            <DialogDescription>
              Avalie a experiência com seu mentor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Avaliação</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                    className={`text-2xl ${
                      rating <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comentário (Opcional)</Label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Compartilhe sua experiência com a mentoria..."
                rows={4}
              />
            </div>

            <Button onClick={handleSubmitReview} className="w-full">
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MentorshipActivitiesPreview({ mentorshipId }: { mentorshipId: string }) {
  const { data: activities } = useMentorshipActivities(mentorshipId);
  
  if (!activities || activities.length === 0) return null;

  return (
    <div className="border-t pt-3">
      <p className="text-sm font-medium mb-2">Atividades Recentes:</p>
      <div className="space-y-2">
        {activities.slice(0, 3).map((activity) => (
          <div key={activity.id} className="text-sm flex items-center justify-between">
            <span className="text-muted-foreground">{activity.description}</span>
            <Badge variant="secondary" className="gap-1">
              <Coins className="h-3 w-3" />
              +{activity.coins_earned}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
