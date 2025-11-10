import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NewImageUpload } from './NewImageUpload';
import { Sparkles, UserPlus, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Tipo específico para cartas exclusivas
interface ExclusiveCard {
  id: string;
  name: string;
  description: string | null;
  rarity: 'common' | 'rare' | 'legendary' | 'mythic';
  image_url: string | null;
  created_at: string;
  assigned_students: string[]; // IDs dos alunos que possuem
}

export function ExclusiveCardSystem() {
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'legendary' as 'common' | 'rare' | 'legendary' | 'mythic',
    image_url: '',
  });

  // Buscar apenas estudantes
  const { data: students } = useQuery({
    queryKey: ['students-for-exclusive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar cartas exclusivas criadas (não na tabela cards, mas em user_cards)
  const { data: exclusiveCards } = useQuery({
    queryKey: ['exclusive-cards'],
    queryFn: async () => {
      // Buscar user_cards com is_special = true
      const { data, error } = await supabase
        .from('user_cards')
        .select(`
          *,
          card:cards!inner(
            id,
            name,
            description,
            rarity,
            image_url,
            is_special,
            created_at
          ),
          profile:profiles!inner(id, name)
        `)
        .eq('card.is_special', true);

      if (error) throw error;

      // Agrupar por carta
      const cardMap = new Map<string, ExclusiveCard>();
      
      data?.forEach((uc: any) => {
        const cardId = uc.card.id;
        if (!cardMap.has(cardId)) {
          cardMap.set(cardId, {
            id: cardId,
            name: uc.card.name,
            description: uc.card.description,
            rarity: uc.card.rarity,
            image_url: uc.card.image_url,
            created_at: uc.card.created_at,
            assigned_students: []
          });
        }
        cardMap.get(cardId)!.assigned_students.push(uc.user_id);
      });

      return Array.from(cardMap.values());
    }
  });

  const createExclusiveCard = useMutation({
    mutationFn: async () => {
      if (selectedStudents.length === 0) {
        throw new Error('Selecione pelo menos um aluno');
      }

      // Criar a carta com is_special = true e available = false
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          name: formData.name,
          description: formData.description,
          rarity: formData.rarity,
          price: 0, // Cartas exclusivas não têm preço
          image_url: formData.image_url,
          available: false, // ❌ NÃO aparece na loja
          is_special: true, // ✅ Marcada como exclusiva
          copies_available: null,
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // Distribuir para alunos selecionados
      const userCards = selectedStudents.map(studentId => ({
        user_id: studentId,
        card_id: card.id,
        quantity: 1
      }));

      const { error: assignError } = await supabase
        .from('user_cards')
        .insert(userCards);

      if (assignError) throw assignError;

      return card;
    },
    onSuccess: () => {
      toast.success('Carta exclusiva criada e distribuída!');
      queryClient.invalidateQueries({ queryKey: ['exclusive-cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        rarity: 'legendary',
        image_url: '',
      });
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar carta exclusiva');
    }
  });

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'bg-gray-500',
      rare: 'bg-blue-500',
      legendary: 'bg-purple-500',
      mythic: 'bg-yellow-500'
    };
    return colors[rarity as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Sistema de Cartas Exclusivas
          </CardTitle>
          <CardDescription>
            Crie cartas especiais que só aparecem para alunos específicos
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Criar Nova</TabsTrigger>
          <TabsTrigger value="view">Cartas Criadas</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Carta Exclusiva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="exclusive-name">Nome da Carta *</Label>
                    <Input
                      id="exclusive-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Carta do Campeão"
                    />
                  </div>

                  <div>
                    <Label htmlFor="exclusive-description">Descrição</Label>
                    <Textarea
                      id="exclusive-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição especial da carta"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="exclusive-rarity">Raridade</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(value: any) => setFormData({ ...formData, rarity: value })}
                    >
                      <SelectTrigger id="exclusive-rarity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Comum</SelectItem>
                        <SelectItem value="rare">Rara</SelectItem>
                        <SelectItem value="legendary">Lendária</SelectItem>
                        <SelectItem value="mythic">Mítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Imagem da Carta</Label>
                    <NewImageUpload
                      currentImageUrl={formData.image_url}
                      onImageSelected={(url) => setFormData({ ...formData, image_url: url })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Selecionar Alunos *
                    </Label>
                    <Badge variant="secondary">
                      {selectedStudents.length} selecionados
                    </Badge>
                  </div>
                  
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                    {students?.map((student) => (
                      <div
                        key={student.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedStudents.includes(student.id)
                            ? 'bg-primary text-primary-foreground border-2 border-primary'
                            : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                        }`}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm opacity-80">{student.email}</p>
                      </div>
                    ))}
                    {(!students || students.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum aluno encontrado
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => createExclusiveCard.mutate()}
                disabled={!formData.name || selectedStudents.length === 0 || createExclusiveCard.isPending}
                className="w-full"
                size="lg"
              >
                <Gift className="w-4 h-4 mr-2" />
                {createExclusiveCard.isPending ? 'Criando...' : 'Criar e Distribuir Carta Exclusiva'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Cartas Exclusivas Criadas</CardTitle>
            </CardHeader>
            <CardContent>
              {!exclusiveCards || exclusiveCards.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma carta exclusiva criada ainda
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {exclusiveCards.map((card) => (
                    <Card key={card.id} className="overflow-hidden">
                      {card.image_url && (
                        <div className="aspect-video w-full bg-muted overflow-hidden">
                          <img 
                            src={card.image_url} 
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{card.name}</CardTitle>
                          <Badge className={getRarityColor(card.rarity)}>
                            {card.rarity}
                          </Badge>
                        </div>
                        {card.description && (
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm">
                          <UserPlus className="w-4 h-4" />
                          <span>{card.assigned_students.length} aluno(s)</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
