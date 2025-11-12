import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAvailableCards } from '@/hooks/useNewCards';
import { useCreatePack, CreatePackData } from '@/hooks/packs/usePacks';
import { Plus, Minus, Package, Sparkles, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface NewPackFormProps {
  editingPack?: any;
  onSuccess?: () => void;
}

export function NewPackForm({ editingPack, onSuccess }: NewPackFormProps) {
  const [selectedCards, setSelectedCards] = useState<{ card_id: string; quantity: number }[]>([]);
  const { data: availableCards } = useAvailableCards();
  const createPack = useCreatePack();

  const form = useForm<z.infer<typeof packSchema>>({
    resolver: zodResolver(packSchema),
    defaultValues: editingPack ? {
      name: editingPack.name,
      price: editingPack.price,
      limit_per_student: editingPack.limit_per_student,
      pack_type: editingPack.pack_type,
      probability_common: editingPack.probability_common || 60,
      probability_rare: editingPack.probability_rare || 25,
      probability_legendary: editingPack.probability_legendary || 10,
      probability_mythic: editingPack.probability_mythic || 5,
    } : {
      name: '',
      price: 50,
      limit_per_student: 5,
      pack_type: 'random',
      probability_common: 60,
      probability_rare: 25,
      probability_legendary: 10,
      probability_mythic: 5,
    },
  });

  const packType = form.watch('pack_type');
  const probCommon = form.watch('probability_common') || 0;
  const probRare = form.watch('probability_rare') || 0;
  const probLegendary = form.watch('probability_legendary') || 0;
  const probMythic = form.watch('probability_mythic') || 0;
  const totalProb = probCommon + probRare + probLegendary + probMythic;

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
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Criar Novo Pacote</CardTitle>
            <CardDescription>Configure os detalhes do seu pacote de cartas</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Pacote *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ex: Pacote Inicial"
                  className="h-11"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pack_type">Tipo do Pacote *</Label>
                <Select
                  value={packType}
                  onValueChange={(value) => form.setValue('pack_type', value as 'random' | 'fixed')}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">🎲 Aleatório (Probabilidades)</SelectItem>
                    <SelectItem value="fixed">📦 Fixo (Cartas Específicas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  Preço (moedas) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  {...form.register('price', { valueAsNumber: true })}
                  placeholder="50"
                  className="h-11"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limite por Estudante *</Label>
                <Input
                  id="limit"
                  type="number"
                  {...form.register('limit_per_student', { valueAsNumber: true })}
                  placeholder="5"
                  className="h-11"
                />
                {form.formState.errors.limit_per_student && (
                  <p className="text-sm text-destructive">{form.formState.errors.limit_per_student.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Random Pack Probabilities */}
          {packType === 'random' && (
            <div className="space-y-6 p-6 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-2 border-purple-500/20">
              <div>
                <h3 className="text-lg font-semibold mb-2">⚡ Probabilidades de Raridade</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure as chances de cada raridade. Total: <span className={cn(
                    "font-bold",
                    totalProb === 100 ? "text-green-600" : "text-destructive"
                  )}>{totalProb}%</span> (deve ser 100%)
                </p>
              </div>

              <div className="space-y-6">
                {/* Common */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      Comum
                    </Label>
                    <span className="font-bold">{probCommon}%</span>
                  </div>
                  <Slider
                    value={[probCommon]}
                    onValueChange={(value) => form.setValue('probability_common', value[0])}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                </div>

                {/* Rare */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      Rara
                    </Label>
                    <span className="font-bold">{probRare}%</span>
                  </div>
                  <Slider
                    value={[probRare]}
                    onValueChange={(value) => form.setValue('probability_rare', value[0])}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                </div>

                {/* Legendary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      Lendária
                    </Label>
                    <span className="font-bold">{probLegendary}%</span>
                  </div>
                  <Slider
                    value={[probLegendary]}
                    onValueChange={(value) => form.setValue('probability_legendary', value[0])}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                </div>

                {/* Mythic */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Mítica
                    </Label>
                    <span className="font-bold">{probMythic}%</span>
                  </div>
                  <Slider
                    value={[probMythic]}
                    onValueChange={(value) => form.setValue('probability_mythic', value[0])}
                    max={100}
                    step={1}
                    className="py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Fixed Pack Cards */}
          {packType === 'fixed' && (
            <div className="space-y-4 p-6 rounded-lg bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-2 border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">📦 Cartas do Pacote</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione as cartas específicas que estarão neste pacote
                  </p>
                </div>
                <Button type="button" onClick={handleAddCard} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {selectedCards.map((card, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-background rounded-lg border-2">
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
                      <Label htmlFor={`quantity-${index}`} className="whitespace-nowrap text-sm">
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
                      size="icon"
                      onClick={() => handleRemoveCard(index)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {selectedCards.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      Nenhuma carta adicionada. Clique em "Adicionar" para começar.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={createPack.isPending || (packType === 'random' && totalProb !== 100)} 
            className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            {createPack.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                Criando Pacote...
              </>
            ) : (
              <>
                <Package className="w-5 h-5 mr-2" />
                Criar Pacote
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
