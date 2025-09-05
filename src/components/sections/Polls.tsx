import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PollForm } from '@/components/polls/PollForm';
import { PollsList } from '@/components/polls/PollsList';
import { 
  useActivePolls, 
  useAllPolls, 
  useUserVotes, 
  useCreatePoll, 
  useVoteInPoll, 
  useDeactivatePoll,
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
        <PollForm
          onSubmit={handleCreatePoll}
          onCancel={() => setIsCreating(false)}
          loading={createPollMutation.isPending}
        />
      )}

      {/* Lista de votações */}
      <PollsList
        polls={polls}
        userVotes={userVotes}
        isLoading={isLoading}
        onVote={handleVote}
        onDeactivate={isAdmin ? handleDeactivate : undefined}
        showResults={isAdmin}
        voteLoading={voteMutation.isPending}
      />
    </div>
  );
}