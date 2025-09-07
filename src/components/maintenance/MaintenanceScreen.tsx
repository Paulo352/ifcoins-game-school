import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Mail, Clock } from 'lucide-react';

interface MaintenanceScreenProps {
  message: string;
  scheduledAt?: string;
  showEmailNotice?: boolean;
}

export function MaintenanceScreen({ 
  message, 
  scheduledAt, 
  showEmailNotice = true 
}: MaintenanceScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl">
            Sistema em Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {message}
          </p>
          
          {scheduledAt && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Agendado para: {new Date(scheduledAt).toLocaleString('pt-BR')}
              </span>
            </div>
          )}
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              <span>Notificação por Email</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {showEmailNotice 
                ? 'Você será notificado por email quando o sistema voltar ao normal.'
                : 'Verifique novamente em alguns instantes.'
              }
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Desculpe pelo transtorno. Estamos trabalhando para resolver o mais rápido possível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}