import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Users, 
  Coins, 
  BookOpen, 
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalCoins: number;
  totalCards: number;
  totalTrades: number;
  recentActivity: any[];
  userGrowth: any[];
  coinDistribution: any[];
}

export function Analytics() {
  const { profile } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAnalytics();
    }
  }, [profile]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Buscar dados dos usuários
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');

      // Buscar dados das cartas
      const { data: cards } = await supabase
        .from('cards')
        .select('*');

      // Buscar dados das trocas
      const { data: trades } = await supabase
        .from('trades')
        .select('*');

      // Buscar logs de recompensa
      const { data: rewards } = await supabase
        .from('reward_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const totalUsers = profiles?.length || 0;
      const activeUsers = profiles?.filter(p => p.coins > 0).length || 0;
      const totalCoins = profiles?.reduce((sum, p) => sum + (p.coins || 0), 0) || 0;

      // Crescimento de usuários por mês
      const userGrowth = profiles?.reduce((acc: any[], user) => {
        const month = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing.users += 1;
        } else {
          acc.push({ month, users: 1 });
        }
        return acc;
      }, []) || [];

      // Distribuição de moedas por papel
      const coinDistribution = profiles?.reduce((acc: any[], user) => {
        const existing = acc.find(item => item.role === user.role);
        if (existing) {
          existing.coins += user.coins || 0;
          existing.users += 1;
        } else {
          acc.push({ 
            role: user.role, 
            coins: user.coins || 0, 
            users: 1 
          });
        }
        return acc;
      }, []) || [];

      setData({
        totalUsers,
        activeUsers,
        totalCoins,
        totalCards: cards?.length || 0,
        totalTrades: trades?.length || 0,
        recentActivity: rewards || [],
        userGrowth,
        coinDistribution
      });

    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const { data: exportData, error } = await supabase.functions.invoke('admin-tools', {
        body: { action: 'export_data' }
      });

      if (error) throw error;

      // Download do arquivo
      const blob = new Blob([JSON.stringify(exportData.export, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_sistema_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Acesso Negado</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar os relatórios.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Visualize métricas e estatísticas do sistema
          </p>
        </div>
        
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {data?.activeUsers} usuários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moedas em Circulação</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCoins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cartas Disponíveis</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCards}</div>
            <p className="text-xs text-muted-foreground">
              No catálogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trocas Realizadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              Até o momento
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Moedas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição de Moedas por Papel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.coinDistribution.map((item, index) => {
              const percentage = data.totalCoins > 0 ? (item.coins / data.totalCoins) * 100 : 0;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{item.role}s</span>
                    <span>{item.coins.toLocaleString()} moedas ({item.users} usuários)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                data?.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{activity.coins} moedas distribuídas</p>
                      <p className="text-muted-foreground">{activity.reason}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Crescimento de Usuários */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Crescimento de Usuários por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.userGrowth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(item.users / Math.max(...data.userGrowth.map((g: any) => g.users))) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.users}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}