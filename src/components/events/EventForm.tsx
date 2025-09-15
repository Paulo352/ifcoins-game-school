
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Event } from '@/types/supabase';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (eventData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    bonus_multiplier: number;
    bonus_coins?: number;
  }) => Promise<boolean>;
  onCancel: () => void;
  loading: boolean;
}

export function EventForm({ event, onSubmit, onCancel, loading }: EventFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    bonus_multiplier: 1,
    bonus_coins: 0
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        start_date: event.start_date,
        end_date: event.end_date,
        bonus_multiplier: event.bonus_multiplier,
        bonus_coins: (event as any).bonus_coins || 0
      });
    } else {
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        bonus_multiplier: 1,
        bonus_coins: 0
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      if (!event) {
        setFormData({
          name: '',
          description: '',
          start_date: '',
          end_date: '',
          bonus_multiplier: 1,
          bonus_coins: 0
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event ? 'Editar Evento' : 'Criar Novo Evento'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Evento</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Semana da Ciência"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="multiplier">Multiplicador de Moedas</Label>
            <Input
              id="multiplier"
              type="number"
              min="1"
              max="10"
              step="0.1"
              value={formData.bonus_multiplier}
              onChange={(e) => setFormData({...formData, bonus_multiplier: parseFloat(e.target.value)})}
            />
          </div>

          <div>
            <Label htmlFor="bonus_coins">Bonus de Moedas (opcional)</Label>
            <Input
              id="bonus_coins"
              type="number"
              min="0"
              value={formData.bonus_coins}
              onChange={(e) => setFormData({...formData, bonus_coins: parseInt(e.target.value) || 0})}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Moedas que serão distribuídas para todos os estudantes quando o evento for ativado
            </p>
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descrição do evento"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (event ? 'Atualizar Evento' : 'Criar Evento')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
