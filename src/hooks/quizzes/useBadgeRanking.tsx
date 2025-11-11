import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBadgeRanking() {
  return useQuery({
    queryKey: ['badge-ranking'],
    queryFn: async () => {
      // Get badge counts per user
      const { data: standardBadges } = await supabase
        .from('user_quiz_badges')
        .select('user_id, badge_id, quiz_badges(*)');
      
      const { data: customBadges } = await supabase
        .from('user_custom_badges')
        .select('user_id, badge_id, custom_badges(*)');
      
      // Aggregate by user
      const userBadgeCounts = new Map<string, { 
        userId: string; 
        totalBadges: number;
        rareBadges: number;
        badges: any[];
      }>();
      
      standardBadges?.forEach(ub => {
        const current = userBadgeCounts.get(ub.user_id) || {
          userId: ub.user_id,
          totalBadges: 0,
          rareBadges: 0,
          badges: []
        };
        
        current.totalBadges++;
        if (ub.quiz_badges?.requirement_type === 'perfect_score') {
          current.rareBadges++;
        }
        current.badges.push({ type: 'quiz', ...ub.quiz_badges });
        
        userBadgeCounts.set(ub.user_id, current);
      });
      
      customBadges?.forEach(ub => {
        const current = userBadgeCounts.get(ub.user_id) || {
          userId: ub.user_id,
          totalBadges: 0,
          rareBadges: 0,
          badges: []
        };
        
        current.totalBadges++;
        current.rareBadges++; // All custom badges are considered rare
        current.badges.push({ type: 'custom', ...ub.custom_badges });
        
        userBadgeCounts.set(ub.user_id, current);
      });
      
      // Get user names
      const userIds = Array.from(userBadgeCounts.keys());
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      // Combine data
      const ranking = Array.from(userBadgeCounts.values())
        .map(userData => {
          const profile = profiles?.find(p => p.id === userData.userId);
          return {
            ...userData,
            name: profile?.name || profile?.email || 'Unknown',
            email: profile?.email
          };
        })
        .sort((a, b) => {
          if (b.rareBadges !== a.rareBadges) {
            return b.rareBadges - a.rareBadges;
          }
          return b.totalBadges - a.totalBadges;
        });
      
      return ranking;
    }
  });
}
