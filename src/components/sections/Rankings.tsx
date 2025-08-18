
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, Crown, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function Rankings() {
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('coins', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: cardRankings } = useQuery({
    queryKey: ['card-rankings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          user_id,
          profiles(name, email, role),
          total_cards:quantity
        `)
        .order('quantity', { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por usuário e somar total de cartas
      const userCardCounts = data.reduce((acc, item) => {
        const userId = item.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            user: item.profiles,
            totalCards: 0
          };
        }
        acc[userId].totalCards += item.total_cards;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(userCardCounts)
        .sort((a: any, b: any) => b.totalCards - a.totalCards)
        .slice(0, 20);
    },
  });

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive' as const,
      teacher: 'default' as const,
      student: 'secondary' as const,
    };
    
    const labels = {
      admin: 'Admin',
      teacher: 'Professor',
      student: 'Estudante',
    };

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Carregando rankings...</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rankings IFCoins</h1>
        <p className="text-gray-600 mt-1">
          Veja quem está no topo da classificação
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              Ranking por IFCoins
            </CardTitle>
            <CardDescription>
              Estudantes com mais moedas acumuladas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings?.map((user, index) => (
                <div key={user.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-600 w-6">
                      {index + 1}
                    </span>
                    {getPositionIcon(index + 1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.name}</p>
                      {getRoleBadge(user.role)}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ifpr-green text-lg">
                      {user.coins}
                    </p>
                    <p className="text-xs text-gray-500">IFCoins</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              Ranking por Cartas
            </CardTitle>
            <CardDescription>
              Usuários com mais cartas na coleção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cardRankings?.map((item: any, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-600 w-6">
                      {index + 1}
                    </span>
                    {getPositionIcon(index + 1)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{item.user.name}</p>
                      {getRoleBadge(item.user.role)}
                    </div>
                    <p className="text-sm text-gray-600">{item.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600 text-lg">
                      {item.totalCards}
                    </p>
                    <p className="text-xs text-gray-500">Cartas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como Subir no Ranking</CardTitle>
          <CardDescription>Dicas para ganhar mais IFCoins e cartas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Participação nas Aulas</h3>
              <p className="text-sm text-blue-700">
                Seja ativo e participe das atividades. Professores podem dar até 50 moedas por participação.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Compre Cartas</h3>
              <p className="text-sm text-green-700">
                Use suas moedas na loja para comprar cartas especiais e subir no ranking de coleção.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Eventos Especiais</h3>
              <p className="text-sm text-purple-700">
                Participe de eventos do IFPR para ganhar multiplicadores de moedas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
