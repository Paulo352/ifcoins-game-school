import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserRank, useRankProgress } from '@/hooks/useUserRank';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Trophy, BookOpen, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function RankDisplay() {
  const { user } = useAuth();
  const { data, isLoading } = useUserRank(user?.id);
  const progress = useRankProgress(user?.id);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data || !progress) return null;

  const { rank, thresholds } = data;
  const currentThreshold = thresholds.find(t => t.rank_name === rank.current_rank);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Seu Título
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Rank Display */}
        <div className="flex items-center justify-between p-4 rounded-lg border-2" style={{ borderColor: currentThreshold?.color }}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{currentThreshold?.icon}</span>
            <div>
              <h3 className="text-2xl font-bold capitalize">{rank.current_rank}</h3>
              <p className="text-sm text-muted-foreground">Título Atual</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {rank.total_points} pts
          </Badge>
        </div>

        {/* Progress to Next Rank */}
        {progress.progressToNext && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Progresso para {progress.progressToNext.nextRank}</h4>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Pontos
                  </span>
                  <span className="text-muted-foreground">
                    Faltam {progress.progressToNext.pointsNeeded}
                  </span>
                </div>
                <Progress value={Math.min(100, progress.progressToNext.pointsProgress)} />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Quizzes
                  </span>
                  <span className="text-muted-foreground">
                    Faltam {progress.progressToNext.quizzesNeeded}
                  </span>
                </div>
                <Progress value={Math.min(100, progress.progressToNext.quizzesProgress)} />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Badges
                  </span>
                  <span className="text-muted-foreground">
                    Faltam {progress.progressToNext.badgesNeeded}
                  </span>
                </div>
                <Progress value={Math.min(100, progress.progressToNext.badgesProgress)} />
              </div>
            </div>
          </div>
        )}

        {/* All Ranks Preview */}
        <div>
          <h4 className="font-semibold mb-3">Todos os Títulos</h4>
          <div className="grid grid-cols-5 gap-2">
            {thresholds.map((threshold) => {
              const isUnlocked = thresholds.findIndex(t => t.rank_name === threshold.rank_name) <= 
                                thresholds.findIndex(t => t.rank_name === rank.current_rank);
              return (
                <div
                  key={threshold.id}
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    isUnlocked ? 'border-primary bg-primary/5' : 'border-border opacity-50'
                  }`}
                >
                  <span className="text-2xl mb-1">{threshold.icon}</span>
                  <span className="text-xs font-medium capitalize text-center">{threshold.rank_name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
