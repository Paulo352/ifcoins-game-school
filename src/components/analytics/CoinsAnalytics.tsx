import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Coins, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CoinsAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchCoinsData();
  }, [period]);

  const fetchCoinsData = async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      
      const { data: rewards } = await supabase
        .from('reward_logs')
        .select('coins, created_at, reason')
        .gte('created_at', daysAgo.toISOString())
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

      const result = Object.values(grouped);
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Moedas Distribuídas por Dia
          </CardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
