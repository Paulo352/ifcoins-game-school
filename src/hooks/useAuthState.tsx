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
    console.log('useAuthState - Iniciando efeito de autenticação');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuthState - Mudança de estado auth:', event, session?.user?.email, 'Session exists:', !!session);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('useAuthState - Usuário encontrado, buscando perfil em 500ms');
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 500);
        } else {
          console.log('useAuthState - Sem usuário, limpando perfil');
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        console.log('useAuthState - Inicializando autenticação...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('useAuthState - Session inicial:', !!session, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('useAuthState - Usuário inicial encontrado, buscando perfil');
          await fetchProfile(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('useAuthState - Erro ao inicializar auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('useAuthState - Limpando subscription');
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