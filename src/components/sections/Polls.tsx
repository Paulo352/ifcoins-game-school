import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { NewPollForm } from '@/components/polls/NewPollForm';
import { NewPollsList } from '@/components/polls/NewPollsList';
import { 
  useActivePolls, 
  useAllPolls, 
  useUserVotes, 
  useCreatePoll, 
  useVoteInPoll, 
  useDeactivatePoll,
  useDeletePoll,
  CreatePollData 
} from '@/hooks/usePolls';

export function Polls() {
  const { profile } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  
  const isAdmin = profile?.role === 'admin';
  
  // Use diferentes queries baseado no papel do usuário
  const { data: polls, isLoading } = isAdmin ? useAllPolls() : useActivePolls();
  const { data: userVotes = [] } = useUserVotes();
  
  const createPollMutation = useCreatePoll();
  const voteMutation = useVoteInPoll();
  const deactivateMutation = useDeactivatePoll();
  const deleteMutation = useDeletePoll();

  const handleCreatePoll = async (data: CreatePollData) => {
    await createPollMutation.mutateAsync(data);
    setIsCreating(false);
  };

  const handleVote = (pollId: string, optionIds: string[]) => {
    voteMutation.mutate({ pollId, optionIds });
  };

  const handleDeactivate = (pollId: string) => {
    if (window.confirm('Tem certeza que deseja desativar esta votação?')) {
      deactivateMutation.mutate(pollId);
    }
  };

  const handleDelete = (pollId: string) => {
    if (window.confirm('⚠️ ATENÇÃO: Tem certeza que deseja DELETAR PERMANENTEMENTE esta votação? Esta ação não pode ser desfeita!')) {
      deleteMutation.mutate(pollId);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
          <p className="text-muted-foreground">Você precisa estar logado para acessar as votações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Votações</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? 'Gerencie e crie votações para a comunidade' 
              : 'Participe das votações ativas'
            }
          </p>
        </div>
        
        {isAdmin && (
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Votação
          </Button>
        )}
      </div>

      {/* Form de criação */}
      {isCreating && isAdmin && (
        <NewPollForm
          onSubmit={handleCreatePoll}
          onCancel={() => setIsCreating(false)}
          loading={createPollMutation.isPending}
        />
      )}

      {/* Lista de votações */}
      <NewPollsList
        polls={polls}
        userVotes={userVotes}
        isLoading={isLoading}
        onVote={handleVote}
        onDeactivate={isAdmin ? handleDeactivate : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        showResults={isAdmin}
        voteLoading={voteMutation.isPending}
      />
    </div>
  );
}