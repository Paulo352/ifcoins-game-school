import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExclusiveCardHistory } from '@/hooks/cards/useExclusiveCardHistory';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Calendar, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ExclusiveCardHistory() {
  const { user, profile } = useAuth();
  const { data: history, isLoading } = useExclusiveCardHistory(profile?.role === 'admin' || profile?.role === 'teacher' ? undefined : user?.id);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="w-6 h-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Histórico de Cartas Exclusivas</h2>
      </div>

      {!history || history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma carta exclusiva recebida ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry: any) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    {entry.card.name}
                  </span>
                  <span className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(entry.granted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex gap-6">
                  {entry.card.image_url && (
                    <img src={entry.card.image_url} alt={entry.card.name} className="w-32 h-32 object-cover rounded-lg border-2 border-yellow-500/50" />
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Motivo</p>
                      <p className="text-base flex items-start gap-2">
                        <Award className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        {entry.reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Concedido por</p>
                      <p className="text-base">{entry.granted_by_profile.name}</p>
                    </div>
                    {entry.card.description && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                        <p className="text-sm">{entry.card.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
