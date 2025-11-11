import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBadgeRanking } from '@/hooks/quizzes/useBadgeRanking';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

export function BadgeRanking() {
  const { data: ranking, isLoading } = useBadgeRanking();
  const { user } = useAuth();

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="w-8 h-8 text-yellow-500" />
        <div>
          <h2 className="text-3xl font-bold">Ranking de Badges</h2>
          <p className="text-muted-foreground">Alunos com mais conquistas e badges raras</p>
        </div>
      </div>

      <div className="grid gap-4">
        {ranking?.map((entry, index) => {
          const isCurrentUser = entry.userId === user?.id;
          return (
            <Card key={entry.userId} className={isCurrentUser ? 'border-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 flex justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{entry.name}</h3>
                      {isCurrentUser && (
                        <Badge variant="secondary">Você</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{entry.totalBadges} badges total</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-purple-500" />
                        <span>{entry.rareBadges} badges raras</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {entry.rareBadges}
                      </div>
                      <div className="text-xs text-muted-foreground">raras</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {(!ranking || ranking.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma Badge Conquistada</h3>
              <p className="text-muted-foreground">
                Complete quizzes e desbloqueie conquistas para aparecer no ranking!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
