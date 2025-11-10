import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuizRankingProps {
  onBack: () => void;
}

interface RankingEntry {
  user_id: string;
  user_name: string;
  total_quizzes: number;
  total_points: number;
  average_percentage: number;
  total_coins_earned: number;
}

export function QuizRanking({ onBack }: QuizRankingProps) {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<'all' | 'points' | 'quizzes'>('all');

  const { data: ranking, isLoading } = useQuery({
    queryKey: ['quiz-ranking', filter],
    queryFn: async () => {
      // Otimização: buscar apenas estudantes e fazer agregação no SQL
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select(`
          user_id,
          score,
          correct_answers,
          total_questions,
          coins_earned,
          profiles!inner(name, role)
        `)
        .eq('is_completed', true)
        .eq('profiles.role', 'student')
        .order('score', { ascending: false })
        .limit(500); // Limitar para performance

      if (error) throw error;
      if (!attempts || attempts.length === 0) return [];

      // Agrupar por usuário de forma otimizada
      const userStatsMap = new Map<string, RankingEntry>();

      for (const attempt of attempts) {
        const userId = attempt.user_id;
        const userName = (attempt as any).profiles?.name || 'Usuário';
        
        let stats = userStatsMap.get(userId);
        
        if (!stats) {
          stats = {
            user_id: userId,
            user_name: userName,
            total_quizzes: 0,
            total_points: 0,
            average_percentage: 0,
            total_coins_earned: 0
          };
          userStatsMap.set(userId, stats);
        }

        stats.total_quizzes += 1;
        stats.total_points += attempt.score || 0;
        stats.total_coins_earned += attempt.coins_earned || 0;
        
        const percentage = attempt.total_questions > 0 
          ? (attempt.correct_answers / attempt.total_questions) * 100 
          : 0;
        
        stats.average_percentage = 
          ((stats.average_percentage * (stats.total_quizzes - 1)) + percentage) / stats.total_quizzes;
      }

      // Converter para array e ordenar
      const sortedRanking = Array.from(userStatsMap.values());
      
      switch (filter) {
        case 'points':
          sortedRanking.sort((a, b) => b.total_points - a.total_points);
          break;
        case 'quizzes':
          sortedRanking.sort((a, b) => b.total_quizzes - a.total_quizzes);
          break;
        default:
          // Score geral: pontos + bonus por quizzes completados
          sortedRanking.sort((a, b) => {
            const scoreB = b.total_points + (b.total_quizzes * 10);
            const scoreA = a.total_points + (a.total_quizzes * 10);
            return scoreB - scoreA;
          });
      }

      return sortedRanking.slice(0, 100); // Top 100
    },
    staleTime: 30000, // Cache por 30 segundos
    gcTime: 60000, // Manter em cache por 1 minuto
  });

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{position}</span>;
    }
  };

  const userPosition = ranking?.findIndex(r => r.user_id === profile?.id) ?? -1;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ranking de Quizzes</CardTitle>
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Geral
            </Button>
            <Button
              variant={filter === 'points' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('points')}
            >
              Pontos
            </Button>
            <Button
              variant={filter === 'quizzes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('quizzes')}
            >
              Quizzes
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {userPosition >= 0 && (
            <Card className="border-2 border-primary mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    {getRankIcon(userPosition + 1)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Sua Posição</p>
                    <p className="text-sm text-muted-foreground">
                      {userPosition + 1}º lugar
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {ranking![userPosition].total_points} pts
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {ranking?.map((entry, index) => (
              <Card 
                key={entry.user_id}
                className={`border ${
                  entry.user_id === profile?.id ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10">
                      {getRankIcon(index + 1)}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold">{entry.user_name}</p>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>{entry.total_quizzes} quizzes</span>
                        <span>•</span>
                        <span>{entry.average_percentage.toFixed(1)}% média</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.total_points}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!ranking || ranking.length === 0) && (
              <p className="text-center text-muted-foreground py-8">
                Ainda não há dados de ranking disponíveis.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
