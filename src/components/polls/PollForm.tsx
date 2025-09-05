import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Loader2 } from 'lucide-react';
import { CreatePollData } from '@/hooks/usePolls';

interface PollFormProps {
  onSubmit: (data: CreatePollData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  eventId?: string;
}

export function PollForm({ onSubmit, onCancel, loading, eventId }: PollFormProps) {
  const [formData, setFormData] = useState<CreatePollData>({
    title: '',
    description: '',
    event_id: eventId || '',
    allow_multiple_votes: false,
    end_date: '',
    options: ['', '']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = formData.options.filter(option => option.trim() !== '');
    
    if (validOptions.length < 2) {
      return;
    }

    await onSubmit({
      ...formData,
      options: validOptions,
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Nova Votação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Título da Votação *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Escolha do próximo evento"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição opcional da votação"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="end_date">Data de Encerramento *</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              min={minDate}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="multiple_votes"
              checked={formData.allow_multiple_votes}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, allow_multiple_votes: checked }))
              }
            />
            <Label htmlFor="multiple_votes">Permitir múltiplas escolhas</Label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Opções de Votação *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Adicionar Opção
              </Button>
            </div>
            
            <div className="space-y-2">
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    required
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Mínimo de 2 opções necessárias
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || formData.options.filter(o => o.trim()).length < 2}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Votação'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}