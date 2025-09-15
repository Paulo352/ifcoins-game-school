
import React from 'react';
import { EventCard } from './EventCard';
import { Event } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Loader2, Gift } from 'lucide-react';

interface EventsListProps {
  events: Event[] | undefined;
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onDeactivate: (eventId: string) => void;
  onGiveBonus?: (eventId: string) => void;
  loading?: boolean;
}

export function EventsList({ events, isLoading, isAdmin, onEdit, onDelete, onDeactivate, onGiveBonus, loading }: EventsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum evento encontrado
        </h3>
        <p className="text-gray-600">
          {isAdmin ? 'Clique em "Criar Evento" para adicionar o primeiro evento.' : 'Não há eventos disponíveis no momento.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <div key={event.id} className="space-y-2">
          <EventCard
            event={event}
            isAdmin={isAdmin}
            onEdit={onEdit}
            onDelete={onDelete}
            onDeactivate={onDeactivate}
          />
          {isAdmin && (event as any).bonus_coins && (event as any).bonus_coins > 0 && onGiveBonus && (
            <Button
              onClick={() => onGiveBonus(event.id)}
              disabled={loading}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Gift className="w-4 h-4 mr-2" />
              {loading ? 'Distribuindo...' : `Dar ${(event as any).bonus_coins} moedas para todos`}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
