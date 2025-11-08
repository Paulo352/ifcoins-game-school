import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LoanAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // days

  useEffect(() => {
    fetchLoanData();
  }, [period]);

  const fetchLoanData = async () => {
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select('created_at, amount, status')
        .order('created_at', { ascending: true });

      if (!loans) return;

      // Agrupar por mês
      const grouped = loans.reduce((acc: any, loan) => {
        const month = new Date(loan.created_at).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: '2-digit' 
        });
        
        if (!acc[month]) {
          acc[month] = {
            month,
            total: 0,
            aprovados: 0,
            pendentes: 0,
            negados: 0,
            pagos: 0,
            valor: 0
          };
        }
        
        acc[month].total += 1;
        acc[month].valor += loan.amount;
        
        if (loan.status === 'approved') acc[month].aprovados += 1;
        else if (loan.status === 'pending') acc[month].pendentes += 1;
        else if (loan.status === 'denied') acc[month].negados += 1;
        else if (loan.status === 'repaid') acc[month].pagos += 1;
        
        return acc;
      }, {});

      setData(Object.values(grouped));
    } catch (error) {
      console.error('Erro ao buscar dados de empréstimos:', error);
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
            <TrendingUp className="h-5 w-5" />
            Evolução de Empréstimos
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#8884d8" 
              name="Total" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="aprovados" 
              stroke="#82ca9d" 
              name="Aprovados" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="pagos" 
              stroke="#ffc658" 
              name="Pagos" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
