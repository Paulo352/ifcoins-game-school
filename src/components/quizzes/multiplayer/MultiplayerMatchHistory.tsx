import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { History, Trophy, Clock, Users, ChevronDown, ChevronUp, Award, Coins, Gift } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MatchPlayer {
  user_id: string;
  name: string;
  position: number;
  score: number;
  correct_answers: number;
}

export function MultiplayerMatchHistory() {
  const { profile } = useAuth();
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const isAdminOrTeacher = profile?.role === 'admin' || profile?.role === 'teacher';

  const { data: matches, isLoading } = useQuery({
    queryKey: ['multiplayer-match-history-admin'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('multiplayer_match_history')
        .select(`
          *,
          quiz:quizzes(title),
          winner:profiles!multiplayer_match_history_winner_id_fkey(name, email)
        `)
        .order('finished_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: isAdminOrTeacher
  });

  if (!isAdminOrTeacher) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Acesso restrito a professores e administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Histórico de Partidas</h2>
          <p className="text-muted-foreground">Todas as partidas multiplayer realizadas</p>
        </div>
      </div>

      <div className="grid gap-4">
        {matches?.map((match: any) => {
          const duration = match.finished_at && match.started_at 
            ? Math.round((new Date(match.finished_at).getTime() - new Date(match.started_at).getTime()) / 1000 / 60)
            : 0;
          const isExpanded = expandedMatch === match.id;
          const playersRanking = match.players_ranking as MatchPlayer[] || [];

          return (
            <Card key={match.id}>
              <Collapsible open={isExpanded} onOpenChange={() => setExpandedMatch(isExpanded ? null : match.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {match.quiz?.title || 'Quiz'}
                        {match.winner && (
                          <Badge variant="secondary" className="ml-2">
                            <Trophy className="w-3 h-3 mr-1" />
                            {match.winner.name}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(match.finished_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {match.total_players} jogadores
                        </span>
                        {duration > 0 && (
                          <span>{duration} min</span>
                        )}
                      </CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Reward info */}
                    {match.reward_type && match.reward_type !== 'none' && (
                      <div className="p-3 bg-muted rounded-lg flex items-center gap-2">
                        {match.reward_type === 'coins' && <Coins className="w-4 h-4 text-yellow-500" />}
                        {match.reward_type === 'card' && <Gift className="w-4 h-4 text-purple-500" />}
                        {match.reward_type === 'external' && <Gift className="w-4 h-4 text-green-500" />}
                        <span className="text-sm">{match.reward_description}</span>
                      </div>
                    )}

                    {/* Players ranking */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Classificação Final</h4>
                      <div className="grid gap-2">
                        {playersRanking.length > 0 ? (
                          playersRanking.map((player, index) => (
                            <div
                              key={player.user_id}
                              className={`flex items-center gap-3 p-2 rounded-lg ${
                                index < 3 ? 'bg-primary/10' : 'bg-muted/30'
                              }`}
                            >
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                index === 1 ? 'bg-gray-300 text-gray-800' :
                                index === 2 ? 'bg-orange-400 text-orange-950' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {player.position}
                              </div>
                              <span className="flex-1 text-sm font-medium">{player.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {player.correct_answers} acertos
                              </span>
                              <span className="font-bold">{player.score} pts</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Dados de ranking não disponíveis
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {(!matches || matches.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma Partida Encontrada</h3>
              <p className="text-muted-foreground">
                Ainda não há partidas multiplayer finalizadas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}