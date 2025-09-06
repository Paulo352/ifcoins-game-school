import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck } from 'lucide-react';

interface VotingStatsProps {
  pollId: string;
}

export function VotingStats({ pollId }: VotingStatsProps) {
  // Buscar total de estudantes
  const { data: totalStudents } = useQuery({
    queryKey: ['total-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');
      
      if (error) throw error;
      return data.length;
    },
  });

  // Buscar quantos alunos já votaram nesta enquete
  const { data: votedStudents } = useQuery({
    queryKey: ['voted-students', pollId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('poll_votes')
        .select('user_id')
        .eq('poll_id', pollId)
        .in('user_id', (
          await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'student')
        ).data?.map(p => p.id) || []);
      
      if (error) throw error;
      
      // Contar usuários únicos que votaram
      const uniqueVoters = new Set(data.map(vote => vote.user_id));
      return uniqueVoters.size;
    },
    enabled: !!pollId,
  });

  const remainingVotes = (totalStudents || 0) - (votedStudents || 0);
  const participationRate = totalStudents ? ((votedStudents || 0) / totalStudents * 100).toFixed(1) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Alunos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalStudents || 0}</div>
          <p className="text-xs text-muted-foreground">
            Alunos registrados no sistema
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Já Votaram
          </CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{votedStudents || 0}</div>
          <p className="text-xs text-muted-foreground">
            Taxa de participação: {participationRate}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ainda Faltam
          </CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{remainingVotes}</div>
          <p className="text-xs text-muted-foreground">
            Alunos que ainda não votaram
          </p>
        </CardContent>
      </Card>
    </div>
  );
}