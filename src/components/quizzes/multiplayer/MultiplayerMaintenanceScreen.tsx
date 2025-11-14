import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Wrench } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MultiplayerMaintenanceScreen() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-full">
              <Wrench className="w-6 h-6 text-yellow-500" />
            </div>
            <CardTitle className="text-xl">Modo Multiplayer em Manutenção</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              O modo multiplayer está temporariamente em manutenção para melhorias e ajustes.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Estamos trabalhando para trazer uma experiência ainda melhor! 
              Enquanto isso, você pode aproveitar os quizzes no modo solo.
            </p>
            <p className="font-medium text-foreground">
              Em breve estaremos de volta com novidades! 🚀
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
