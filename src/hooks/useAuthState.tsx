import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('useAuthState - Buscando perfil para usuário:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('useAuthState - Erro ao buscar perfil:', error);
        return;
      }
      
      console.log('useAuthState - Perfil encontrado:', data);
      setProfile(data);
    } catch (error) {
      console.error('useAuthState - Erro inesperado ao buscar perfil:', error);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('🔧 useAuthState - Iniciando hook de autenticação');

    const initializeAuth = async () => {
      try {
        console.log('🔧 useAuthState - Verificando sessão existente...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔧 useAuthState - Erro ao obter sessão:', error);
          setLoading(false);
          return;
        }
        
        console.log('🔧 useAuthState - Sessão inicial:', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id
        });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔧 useAuthState - Buscando perfil do usuário:', session.user.id);
          await fetchProfile(session.user.id);
        } else {
          console.log('🔧 useAuthState - Nenhuma sessão encontrada');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('🔧 useAuthState - Erro inesperado ao inicializar:', error);
        setLoading(false);
      }
    };

    // Configurar listener DEPOIS da inicialização
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔧 useAuthState - Mudança de estado:', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id
        });
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('🔧 useAuthState - Nova sessão, buscando perfil...');
          // Usar setTimeout para evitar problemas de deadlock
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          console.log('🔧 useAuthState - Sessão removida, limpando perfil');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Inicializar autenticação
    initializeAuth();

    return () => {
      console.log('🔧 useAuthState - Cleanup do hook');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    profile,
    session,
    loading,
    refreshProfile,
    setProfile,
    setUser,
    setSession
  };
}