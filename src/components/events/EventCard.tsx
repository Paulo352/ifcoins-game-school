
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, Trash2, Trophy, StopCircle, Gift } from 'lucide-react';
import { Event } from '@/types/supabase';

interface EventCardProps {
  event: Event;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onDeactivate: (eventId: string) => void;
}

export function EventCard({ event, isAdmin, onEdit, onDelete, onDeactivate }: EventCardProps) {
  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    // Usar datas locais completas para evitar problemas de fuso horário
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    if (now < start) return 'upcoming';
    if (now > end) return 'finished';
    return 'active';
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'finished': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'upcoming': return 'Próximo';
      case 'finished': return 'Finalizado';
      default: return 'Desconhecido';
    }
  };

  const status = getEventStatus(event.start_date, event.end_date);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{event.name}</CardTitle>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${getEventStatusColor(status)}`}>
              {getEventStatusText(status)}
            </span>
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
                <Edit className="h-4 w-4" />
              </Button>
              {status === 'active' && (
                <Button variant="ghost" size="sm" onClick={() => onDeactivate(event.id)}>
                  <StopCircle className="h-4 w-4 text-orange-500" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onDelete(event.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            {new Date(event.start_date).toLocaleString('pt-BR', { 
              dateStyle: 'short', 
              timeStyle: 'short' 
            })} - {new Date(event.end_date).toLocaleString('pt-BR', { 
              dateStyle: 'short', 
              timeStyle: 'short' 
            })}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-ifpr-green" />
            <span className="font-semibold text-ifpr-green">{event.bonus_multiplier}x moedas</span>
          </div>
          {(event as any).bonus_coins && (event as any).bonus_coins > 0 && (
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-yellow-600">+{(event as any).bonus_coins} moedas bonus</span>
            </div>
          )}
          {event.description && (
            <p className="text-sm text-gray-600">{event.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
