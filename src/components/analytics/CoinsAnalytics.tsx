import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coins } from 'lucide-react';

export function CoinsAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoinsData();
  }, []);

  const fetchCoinsData = async () => {
    try {
      const { data: rewards } = await supabase
        .from('reward_logs')
        .select('coins, created_at, reason')
        .order('created_at', { ascending: true });

      if (!rewards) return;

      // Agrupar por dia
      const grouped = rewards.reduce((acc: any, reward) => {
        const day = new Date(reward.created_at).toLocaleDateString('pt-BR', { 
          day: '2-digit',
          month: 'short'
        });
        
        if (!acc[day]) {
          acc[day] = {
            dia: day,
            moedas: 0,
            distribuicoes: 0
          };
        }
        
        acc[day].moedas += reward.coins;
        acc[day].distribuicoes += 1;
        
        return acc;
      }, {});

      // Pegar últimos 30 dias
      const result = Object.values(grouped).slice(-30);
      setData(result);
    } catch (error) {
      console.error('Erro ao buscar dados de moedas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Moedas Distribuídas por Dia (Últimos 30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="moedas" fill="#22c55e" name="Moedas Distribuídas" />
            <Bar dataKey="distribuicoes" fill="#3b82f6" name="Nº de Distribuições" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
