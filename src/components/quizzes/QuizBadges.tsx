import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QuizBadgesProps {
  onBack: () => void;
}

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  earned_at?: string;
  earned: boolean;
}

export function QuizBadges({ onBack }: QuizBadgesProps) {
  const { profile } = useAuth();

  const { data: badges, isLoading } = useQuery({
    queryKey: ['quiz-badges', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];

      // Buscar todos os badges
      const { data: allBadges, error: badgesError } = await supabase
        .from('quiz_badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (badgesError) throw badgesError;

      // Buscar badges do usuário
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_quiz_badges')
        .select('badge_id, earned_at')
        .eq('user_id', profile.id);

      if (userBadgesError) throw userBadgesError;

      // Combinar dados
      const userBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
      
      return allBadges.map(badge => {
        const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
        return {
          ...badge,
          earned: userBadgeIds.has(badge.id),
          earned_at: userBadge?.earned_at
        };
      }) as BadgeData[];
    },
    enabled: !!profile?.id
  });

  const earnedBadges = badges?.filter(b => b.earned) || [];
  const totalBadges = badges?.length || 0;

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
            <div>
              <CardTitle>Conquistas</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {earnedBadges.length} de {totalBadges} badges conquistados
              </p>
            </div>
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges?.map((badge) => (
              <Card 
                key={badge.id} 
                className={`border-2 transition-all ${
                  badge.earned 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted opacity-60'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${!badge.earned && 'grayscale'}`}>
                      {badge.earned ? badge.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{badge.name}</h3>
                        {badge.earned && (
                          <Award className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {badge.description}
                      </p>
                      
                      {badge.earned && badge.earned_at ? (
                        <Badge variant="outline" className="text-xs">
                          Conquistado em {format(new Date(badge.earned_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3" />
                          <span>Não conquistado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
