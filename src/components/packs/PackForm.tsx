import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailableCards } from '@/hooks/cards/useCards';
import { useCreatePack, CreatePackData } from '@/hooks/packs/usePacks';
import { Plus, Minus, Package } from 'lucide-react';

const packSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().min(1, 'Preço deve ser maior que 0'),
  limit_per_student: z.number().min(1, 'Limite deve ser maior que 0'),
  pack_type: z.enum(['random', 'fixed']),
  probability_common: z.number().min(0).max(100).optional(),
  probability_rare: z.number().min(0).max(100).optional(),
  probability_legendary: z.number().min(0).max(100).optional(),
  probability_mythic: z.number().min(0).max(100).optional(),
});

interface PackFormProps {
  onSuccess?: () => void;
}

export function PackForm({ onSuccess }: PackFormProps) {
  const [selectedCards, setSelectedCards] = useState<{ card_id: string; quantity: number }[]>([]);
  const { data: availableCards } = useAvailableCards();
  const createPack = useCreatePack();

  const form = useForm<z.infer<typeof packSchema>>({
    resolver: zodResolver(packSchema),
    defaultValues: {
      name: '',
      price: 10,
      limit_per_student: 5,
      pack_type: 'random',
      probability_common: 60,
      probability_rare: 25,
      probability_legendary: 10,
      probability_mythic: 5,
    },
  });

  const packType = form.watch('pack_type');

  const handleAddCard = () => {
    setSelectedCards([...selectedCards, { card_id: '', quantity: 1 }]);
  };

  const handleRemoveCard = (index: number) => {
    setSelectedCards(selectedCards.filter((_, i) => i !== index));
  };

  const handleCardChange = (index: number, field: 'card_id' | 'quantity', value: string | number) => {
    const updated = [...selectedCards];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedCards(updated);
  };

  const onSubmit = (data: z.infer<typeof packSchema>) => {
    const packData: CreatePackData = {
      name: data.name,
      price: data.price,
      limit_per_student: data.limit_per_student,
      pack_type: data.pack_type,
      probability_common: data.probability_common,
      probability_rare: data.probability_rare,
      probability_legendary: data.probability_legendary,
      probability_mythic: data.probability_mythic,
      cards: packType === 'fixed' ? selectedCards.filter(card => card.card_id) : undefined,
    };

    createPack.mutate(packData, {
      onSuccess: () => {
        form.reset();
        setSelectedCards([]);
        onSuccess?.();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Criar Novo Pacote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Pacote</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Digite o nome do pacote"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Preço (moedas)</Label>
              <Input
                id="price"
                type="number"
                {...form.register('price', { valueAsNumber: true })}
                placeholder="10"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="limit">Limite por Estudante</Label>
              <Input
                id="limit"
                type="number"
                {...form.register('limit_per_student', { valueAsNumber: true })}
                placeholder="5"
              />
              {form.formState.errors.limit_per_student && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.limit_per_student.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="pack_type">Tipo do Pacote</Label>
              <Select
                value={packType}
                onValueChange={(value) => form.setValue('pack_type', value as 'random' | 'fixed')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Aleatório</SelectItem>
                  <SelectItem value="fixed">Fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {packType === 'random' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Probabilidades (%)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="common">Comum</Label>
                  <Input
                    id="common"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('probability_common', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="rare">Rara</Label>
                  <Input
                    id="rare"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('probability_rare', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="legendary">Lendária</Label>
                  <Input
                    id="legendary"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('probability_legendary', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <Label htmlFor="mythic">Mítica</Label>
                  <Input
                    id="mythic"
                    type="number"
                    min="0"
                    max="100"
                    {...form.register('probability_mythic', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>
          )}

          {packType === 'fixed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Cartas do Pacote</h3>
                <Button type="button" onClick={handleAddCard} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Carta
                </Button>
              </div>

              <div className="space-y-3">
                {selectedCards.map((card, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Select
                      value={card.card_id}
                      onValueChange={(value) => handleCardChange(index, 'card_id', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione uma carta" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCards?.map((availableCard) => (
                          <SelectItem key={availableCard.id} value={availableCard.id}>
                            {availableCard.name} ({availableCard.rarity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`quantity-${index}`} className="whitespace-nowrap">
                        Qtd:
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={card.quantity}
                        onChange={(e) => handleCardChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCard(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {selectedCards.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma carta adicionada. Clique em "Adicionar Carta" para começar.
                  </p>
                )}
              </div>
            </div>
          )}

          <Button type="submit" disabled={createPack.isPending} className="w-full">
            {createPack.isPending ? 'Criando...' : 'Criar Pacote'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}