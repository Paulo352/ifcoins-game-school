import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Trophy, Award, Star, Medal } from 'lucide-react';

export function useAchievementNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['achievement-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('read', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Listen for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'achievement_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Show toast notification
          const icon = getNotificationIcon(notification.type);
          toast.success(notification.title, {
            description: notification.message,
            icon,
            duration: 5000,
          });

          // Invalidate queries
          queryClient.invalidateQueries({ queryKey: ['achievement-notifications'] });
          queryClient.invalidateQueries({ queryKey: ['badge-ranking'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('achievement_notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-notifications'] });
    }
  });

  return {
    notifications,
    markAsRead: markAsReadMutation.mutate
  };
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'badge_earned':
      return <Award className="w-5 h-5 text-yellow-500" />;
    case 'rank_achieved':
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 'level_up':
      return <Star className="w-5 h-5 text-purple-500" />;
    case 'match_won':
      return <Medal className="w-5 h-5 text-blue-500" />;
    default:
      return <Trophy className="w-5 h-5" />;
  }
}
