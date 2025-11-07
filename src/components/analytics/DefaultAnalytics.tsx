import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle } from 'lucide-react';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

export function DefaultAnalytics() {
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, overdue: 0, rate: '0%' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDefaultData();
  }, []);

  const fetchDefaultData = async () => {
    try {
      const { data: loans } = await supabase
        .from('loans')
        .select('status, is_overdue');

      if (!loans) return;

      const statusCount = loans.reduce((acc: any, loan) => {
        const key = loan.status;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const chartData = [
        { name: 'Aprovados', value: statusCount.approved || 0 },
        { name: 'Em Atraso', value: loans.filter(l => l.is_overdue).length || 0 },
        { name: 'Pagos', value: statusCount.repaid || 0 },
        { name: 'Pendentes', value: statusCount.pending || 0 }
      ];

      const totalApproved = statusCount.approved || 0;
      const overdueCount = loans.filter(l => l.is_overdue).length;
      const defaultRate = totalApproved > 0 
        ? ((overdueCount / totalApproved) * 100).toFixed(1)
        : '0';

      setData(chartData);
      setStats({
        total: totalApproved,
        overdue: overdueCount,
        rate: `${defaultRate}%`
      });
    } catch (error) {
      console.error('Erro ao buscar dados de inadimplência:', error);
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
          <AlertCircle className="h-5 w-5" />
          Status dos Empréstimos e Taxa de Inadimplência
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Aprovados</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Em Atraso</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-600">Taxa de Inadimplência</p>
            <p className="text-2xl font-bold text-orange-600">{stats.rate}</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
