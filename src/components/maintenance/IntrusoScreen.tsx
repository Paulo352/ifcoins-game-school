import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function IntrusoScreen() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Olá, <strong>{profile?.name || 'Usuário'}</strong>!
            </p>
            <p className="text-muted-foreground">
              Seu e-mail <strong className="text-foreground">{profile?.email}</strong> não pertence a um domínio autorizado para acesso ao sistema.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Domínios permitidos:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>@estudantes.ifpr.edu.br (Estudantes)</li>
                <li>@ifpr.edu.br (Professores)</li>
                <li>@admin.ifpr.edu.br (Administradores)</li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              Para obter acesso ao sistema, entre em contato com a administração para que sua conta seja liberada.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => window.location.href = 'mailto:suporte@ifpr.edu.br'}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contatar Administração
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}