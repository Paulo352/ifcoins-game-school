import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Vote } from 'lucide-react';
import { useActivePolls } from '@/hooks/usePolls';

export function PollIndicator() {
  const { data: polls } = useActivePolls();
  
  const activePolls = polls?.filter(poll => {
    const now = new Date();
    const endDate = new Date(poll.end_date);
    return poll.is_active && endDate > now;
  });

  if (!activePolls || activePolls.length === 0) {
    return null;
  }

  return (
    <Badge variant="default" className="flex items-center gap-1">
      <Vote className="h-3 w-3" />
      {activePolls.length} votação{activePolls.length > 1 ? 'ões' : ''} ativa{activePolls.length > 1 ? 's' : ''}
    </Badge>
  );
}