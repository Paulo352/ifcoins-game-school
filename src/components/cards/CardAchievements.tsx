import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCardAchievements, useUserCardAchievements, useCheckAndUnlockAchievements } from '@/hooks/cards/useCardAchievements';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Target, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function CardAchievements() {
  const { user } = useAuth();
  const { data: achievements } = useCardAchievements();
  const { data: userAchievements } = useUserCardAchievements(user?.id);
  const checkAchievementsMutation = useCheckAndUnlockAchievements();

  const { data: userStats } = useQuery({
    queryKey: ['user-achievement-stats', user?.id],
    queryFn: async () => {
      const [quizzes, cards] = await Promise.all([
        supabase.from('quiz_attempts').select('score').eq('user_id', user?.id).eq('is_completed', true),
        supabase.from('user_cards').select('card_id').eq('user_id', user?.id)
      ]);
      
      return {
        quizzesCompleted: quizzes.data?.length || 0,
        totalScore: quizzes.data?.reduce((sum, a) => sum + (a.score || 0), 0) || 0,
        cardsCollected: cards.data?.length || 0
      };
    },
    enabled: !!user?.id
  });

  const unlockedIds = new Set(userAchievements?.map((ua: any) => ua.achievement_id));

  const getProgress = (achievement: any) => {
    if (!userStats) return 0;
    
    let current = 0;
    switch ((achievement as any).objective_type) {
      case 'quizzes_completed': current = userStats.quizzesCompleted; break;
      case 'total_score': current = userStats.totalScore; break;
      case 'cards_collected': current = userStats.cardsCollected; break;
    }
    
    return Math.min(100, (current / (achievement as any).objective_value) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Conquistas de Cartas</h2>
        </div>
        <Button onClick={() => checkAchievementsMutation.mutate(user?.id!)} disabled={checkAchievementsMutation.isPending}>
          <Sparkles className="w-4 h-4 mr-2" />
          Verificar Conquistas
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {achievements?.map((achievement: any) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const progress = getProgress(achievement);
          
          return (
            <Card key={achievement.id} className={isUnlocked ? 'border-yellow-500/50 bg-yellow-500/5' : 'opacity-75'}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {isUnlocked ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                    {achievement.name}
                  </span>
                  {isUnlocked && <Badge variant="secondary">Desbloqueado!</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{achievement.objective_type.replace('_', ' ')}</span>
                      <span>{Math.floor(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>

                {achievement.reward_card && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {achievement.reward_card.image_url && (
                      <img src={achievement.reward_card.image_url} alt={achievement.reward_card.name} className="w-16 h-16 object-cover rounded border" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Recompensa</p>
                      <p className="text-xs text-muted-foreground">{achievement.reward_card.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
