import React from 'react';
import { PollCard } from './PollCard';
import { PollWithOptions, PollVote } from '@/hooks/usePolls';
import { Loader2 } from 'lucide-react';

interface PollsListProps {
  polls: PollWithOptions[] | undefined;
  userVotes: PollVote[];
  isLoading: boolean;
  onVote: (pollId: string, optionIds: string[]) => void;
  onDeactivate?: (pollId: string) => void;
  showResults?: boolean;
  voteLoading?: boolean;
}

export function PollsList({ 
  polls, 
  userVotes, 
  isLoading, 
  onVote, 
  onDeactivate, 
  showResults = false,
  voteLoading = false
}: PollsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!polls || polls.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma votação encontrada
        </h3>
        <p className="text-gray-600">
          Não há votações disponíveis no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          userVotes={userVotes.filter(vote => vote.poll_id === poll.id)}
          onVote={onVote}
          onDeactivate={onDeactivate}
          showResults={showResults}
          voteLoading={voteLoading}
        />
      ))}
    </div>
  );
}