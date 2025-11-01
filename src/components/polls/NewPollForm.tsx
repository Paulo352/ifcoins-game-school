import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { CreatePollData } from '@/hooks/usePolls';
import { ImageSelector } from '@/components/cards/ImageSelector';

interface NewPollFormProps {
  onSubmit: (data: CreatePollData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  eventId?: string;
}

interface PollOption {
  text: string;
  imageUrl?: string;
}

export function NewPollForm({ onSubmit, onCancel, loading, eventId }: NewPollFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([
    { text: '', imageUrl: '' },
    { text: '', imageUrl: '' }
  ]);
  const [showImageSelectors, setShowImageSelectors] = useState<{ [key: number]: boolean }>({});

  const addOption = () => {
    setOptions([...options, { text: '', imageUrl: '' }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
      const newShowImageSelectors = { ...showImageSelectors };
      delete newShowImageSelectors[index];
      setShowImageSelectors(newShowImageSelectors);
    }
  };

  const updateOptionText = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  const updateOptionImage = (index: number, imageUrl: string) => {
    const newOptions = [...options];
    newOptions[index].imageUrl = imageUrl;
    setOptions(newOptions);
  };

  const toggleImageSelector = (index: number) => {
    setShowImageSelectors(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    
    if (validOptions.length < 2) {
      alert('A votação precisa ter pelo menos 2 opções válidas');
      return;
    }

    await onSubmit({
      title,
      description: description || undefined,
      end_date: endDate,
      allow_multiple_votes: allowMultiple,
      event_id: eventId,
      options: validOptions.map((opt, index) => ({
        option_text: opt.text,
        option_order: index,
        image_url: opt.imageUrl || undefined
      }))
    });
  };

  return (
    <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">✨ Nova Votação</CardTitle>
        <CardDescription>
          Crie uma votação com ou sem imagens (ideal para escolher mascotes, logos, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Título da Votação *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Escolha o mascote da turma"
              required
              className="border-2"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Descrição (opcional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes sobre a votação..."
              rows={3}
              className="border-2 resize-none"
            />
          </div>

          {/* Data de término */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-base font-semibold">
              Data de Término *
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="border-2"
            />
          </div>

          {/* Múltiplos votos */}
          <div className="flex items-center justify-between p-4 rounded-lg border-2 border-border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="allowMultiple" className="text-base font-semibold cursor-pointer">
                Permitir múltiplos votos
              </Label>
              <p className="text-sm text-muted-foreground">
                Usuários podem escolher mais de uma opção
              </p>
            </div>
            <Switch
              id="allowMultiple"
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
            />
          </div>

          {/* Opções */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Opções de Votação * (mínimo 2)
              </Label>
              <Button
                type="button"
                onClick={addOption}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Opção
              </Button>
            </div>

            <div className="space-y-4">
              {options.map((option, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            value={option.text}
                            onChange={(e) => updateOptionText(index, e.target.value)}
                            placeholder={`Opção ${index + 1}`}
                            required
                            className="border-2"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => toggleImageSelector(index)}
                          className={option.imageUrl ? 'border-primary text-primary' : ''}
                          title="Adicionar imagem"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeOption(index)}
                            title="Remover opção"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {/* Seletor de imagem */}
                      {showImageSelectors[index] && (
                        <div className="pl-2 border-l-2 border-primary/30">
                          <ImageSelector
                            value={option.imageUrl || ''}
                            onChange={(url) => updateOptionImage(index, url)}
                            label="Imagem da opção"
                            placeholder="URL da imagem ou faça upload"
                          />
                        </div>
                      )}

                      {/* Preview da imagem */}
                      {option.imageUrl && !showImageSelectors[index] && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <img
                            src={option.imageUrl}
                            alt={option.text}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-muted-foreground">Imagem adicionada</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || options.filter(opt => opt.text.trim()).length < 2}
              className="flex-1 h-11 text-base font-semibold"
            >
              {loading ? '⏳ Criando...' : '✅ Criar Votação'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="h-11 px-8"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
