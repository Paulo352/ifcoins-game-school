import React from 'react';
import { NewPollCard } from './NewPollCard';
import { PollWithOptions, PollVote } from '@/hooks/usePolls';
import { Loader2 } from 'lucide-react';

interface NewPollsListProps {
  polls?: PollWithOptions[];
  userVotes: PollVote[];
  isLoading: boolean;
  onVote: (pollId: string, optionIds: string[]) => void;
  onDeactivate?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
  showResults?: boolean;
  voteLoading?: boolean;
}

export function NewPollsList({
  polls,
  userVotes,
  isLoading,
  onVote,
  onDeactivate,
  onDelete,
  showResults = false,
  voteLoading = false
}: NewPollsListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">Nenhuma votação disponível</h3>
        <p className="text-muted-foreground">
          {showResults 
            ? 'Não há votações cadastradas no momento'
            : 'Não há votações ativas no momento'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {polls.map((poll) => (
        <NewPollCard
          key={poll.id}
          poll={poll}
          userVotes={userVotes}
          onVote={onVote}
          onDeactivate={onDeactivate}
          onDelete={onDelete}
          showResults={showResults}
          voteLoading={voteLoading}
        />
      ))}
    </div>
  );
}
