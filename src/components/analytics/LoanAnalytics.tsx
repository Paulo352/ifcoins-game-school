import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';

export function LoanAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoanData();
  }, []);

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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução de Empréstimos
        </CardTitle>
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
