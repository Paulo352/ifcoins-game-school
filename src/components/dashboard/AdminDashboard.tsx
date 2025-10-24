
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminStats } from '../admin/AdminStats';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Coins, Award, Calendar, BookOpen, Package, HelpCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizReports } from '@/components/quizzes/QuizReports';

export function AdminDashboard() {
  const { profile } = useAuth();
  const { stats, loading } = useAdminStats();
  const [showQuizReports, setShowQuizReports] = useState(false);

  if (!profile || profile.role !== 'admin') return null;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showQuizReports) {
    return <QuizReports onBack={() => setShowQuizReports(false)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema e estatísticas</p>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Total de Usuários</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
            <p className="text-sm text-muted-foreground">
              {stats.totalStudents} estudantes, {stats.totalTeachers} professores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">Moedas em Circulação</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalCoinsInCirculation}</p>
            <p className="text-sm text-muted-foreground">Total no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Cartas Criadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.totalCards}</p>
            <p className="text-sm text-muted-foreground">No sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Eventos Ativos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.totalEvents}</p>
            <p className="text-sm text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowQuizReports(true)}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <FileText className="h-5 w-5" />
              Ver Relatórios de Quiz
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">por {activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
