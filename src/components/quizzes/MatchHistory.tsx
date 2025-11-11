import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMatchHistory, useMatchDetails } from '@/hooks/quizzes/useMatchHistory';
import { useAuth } from '@/contexts/AuthContext';
import { History, Trophy, Clock, Users, ChevronRight, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MatchHistory() {
  const { user } = useAuth();
  const { data: matches, isLoading } = useMatchHistory(user?.id);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const { data: matchDetails } = useMatchDetails(selectedMatchId!);

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
          <h2 className="text-3xl font-bold">Histórico de Partidas Multiplayer</h2>
          <p className="text-muted-foreground">Reveja suas partidas e estatísticas detalhadas</p>
        </div>
      </div>

      <div className="grid gap-4">
        {matches?.map((match: any) => {
          const duration = match.finished_at && match.started_at 
            ? Math.round((new Date(match.finished_at).getTime() - new Date(match.started_at).getTime()) / 1000 / 60)
            : 0;

          return (
            <Card key={match.id} className="hover:border-primary transition-colors cursor-pointer">
              <CardContent className="p-6" onClick={() => setSelectedMatchId(match.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{match.quiz?.title || 'Quiz'}</h3>
                      {match.winner?.name && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Vencedor: {match.winner.name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(match.finished_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{match.total_players} jogadores</span>
                      </div>
                      {duration > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{duration} min</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="icon">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!matches || matches.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma Partida Encontrada</h3>
              <p className="text-muted-foreground">
                Participe de quizzes multiplayer para ver seu histórico aqui!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Details Dialog */}
      <Dialog open={!!selectedMatchId} onOpenChange={() => setSelectedMatchId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Detalhes da Partida
            </DialogTitle>
          </DialogHeader>

          {matchDetails && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{matchDetails.quiz?.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Sala: {matchDetails.room_id.substring(0, 8)}</span>
                    <span>{matchDetails.total_players} jogadores</span>
                    <span>{format(new Date(matchDetails.finished_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>

                {matchDetails.winner && (
                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <div>
                          <div className="text-sm text-muted-foreground">Vencedor</div>
                          <div className="font-semibold text-lg">{matchDetails.winner.name}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Ranking Final</h4>
                <div className="space-y-2">
                  {matchDetails.players
                    ?.sort((a: any, b: any) => (b.quiz_attempts?.[0]?.score || 0) - (a.quiz_attempts?.[0]?.score || 0))
                    .map((player: any, index: number) => (
                      <Card key={player.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-8 text-center font-bold text-lg">
                              #{index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{player.profiles?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {player.profiles?.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold">
                                  {player.quiz_attempts?.[0]?.score || 0} pts
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {player.quiz_attempts?.[0]?.correct_answers || 0} corretas
                                </div>
                              </div>
                              {index === 0 && (
                                <Award className="w-6 h-6 text-yellow-500" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {matchDetails.match_data && (
                <div>
                  <h4 className="font-semibold mb-3">Estatísticas da Partida</h4>
                  <Card>
                    <CardContent className="p-4">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(matchDetails.match_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
