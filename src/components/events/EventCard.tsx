
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, Trash2, Trophy } from 'lucide-react';
import { Event } from '@/types/supabase';

interface EventCardProps {
  event: Event;
  isAdmin: boolean;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

export function EventCard({ event, isAdmin, onEdit, onDelete }: EventCardProps) {
  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
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
            {new Date(event.start_date).toLocaleDateString('pt-BR')} - {new Date(event.end_date).toLocaleDateString('pt-BR')}
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-ifpr-green" />
            <span className="font-semibold text-ifpr-green">{event.bonus_multiplier}x moedas</span>
          </div>
          {event.description && (
            <p className="text-sm text-gray-600">{event.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
