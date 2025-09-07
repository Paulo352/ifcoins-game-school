
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Coins, TrendingUp, Calendar, Settings, Loader2 } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { DailyCoinsConfig } from '@/components/admin/DailyCoinsConfig';

interface AdminDashboardProps {
  onSectionChange: (section: string) => void;
}

export function AdminDashboard({ onSectionChange }: AdminDashboardProps) {
  const { profile } = useAuth();
  const { stats, loading } = useAdminStats();

  if (!profile || profile.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const dashboardStats = [
    { title: 'Estudantes Ativos', value: stats.totalStudents.toString(), icon: Users, color: 'text-blue-600' },
    { title: 'Cartas Disponíveis', value: stats.totalCards.toString(), icon: BookOpen, color: 'text-green-600' },
    { title: 'Moedas em Circulação', value: stats.totalCoinsInCirculation.toString(), icon: Coins, color: 'text-yellow-600' },
    { title: 'Trocas Realizadas', value: stats.totalTrades.toString(), icon: TrendingUp, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Painel Administrativo
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo, {profile.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <CardTitle className="text-lg">{stat.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('manage-students')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gerenciar Estudantes
            </CardTitle>
            <CardDescription>
              Cadastrar e gerenciar estudantes do sistema
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('manage-cards')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              Gerenciar Cartas
            </CardTitle>
            <CardDescription>
              Adicionar e configurar cartas colecionáveis
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('give-coins')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              Dar Moedas
            </CardTitle>
            <CardDescription>
              Dar moedas para estudantes e professores
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => onSectionChange('events')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Eventos Especiais
            </CardTitle>
            <CardDescription>
              Criar e gerenciar eventos da escola
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-gray-600">por {activity.user}</p>
                    </div>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma atividade recente</p>
                  <p className="text-sm">As ações dos usuários aparecerão aqui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Rápidas</CardTitle>
            <CardDescription>Acesso rápido às principais configurações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button 
              onClick={() => onSectionChange('settings')}
              className="w-full flex items-center gap-3 p-3 bg-ifpr-green text-white rounded-lg hover:bg-ifpr-green-dark transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span>Configurações do Sistema</span>
            </button>
            <button 
              onClick={() => onSectionChange('analytics')}
              className="w-full flex items-center gap-3 p-3 bg-ifpr-blue text-white rounded-lg hover:bg-ifpr-blue-dark transition-colors"
            >
              <TrendingUp className="h-5 w-5" />
              <span>Relatórios e Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Calendar className="h-5 w-5" />
              <span>Backup de Dados</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
