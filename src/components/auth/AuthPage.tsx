
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { AuthHeader } from './AuthHeader';
import { LoginForm } from './LoginForm';
import { RegistrationForm } from './RegistrationForm';
import { TestAccountsInfo } from './TestAccountsInfo';
import { MaintenanceScreen } from '@/components/maintenance/MaintenanceScreen';

export function AuthPage() {
  const { loading } = useAuth();
  const { status: maintenanceStatus } = useMaintenanceMode();

  if (loading || maintenanceStatus.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-primary">Carregando...</p>
        </div>
      </div>
    );
  }

  // Verificar modo manutenção
  if (maintenanceStatus.enabled) {
    return (
      <MaintenanceScreen 
        message={maintenanceStatus.message}
        scheduledAt={maintenanceStatus.scheduled_at}
        showEmailNotice={true}
        showBackToLogin={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <AuthHeader />
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <RegistrationForm />
            </TabsContent>
          </Tabs>
          
          <TestAccountsInfo />
        </CardContent>
      </Card>
    </div>
  );
}
