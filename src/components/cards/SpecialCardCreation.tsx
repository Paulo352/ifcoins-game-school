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
import { Sparkles, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SpecialCardCreation() {
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'common' as 'common' | 'rare' | 'legendary' | 'mythic',
    price: 0,
    image_url: '',
  });

  // Fetch students
  const { data: students } = useQuery({
    queryKey: ['students'],
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

  const createSpecialCard = useMutation({
    mutationFn: async () => {
      if (selectedStudents.length === 0) {
        throw new Error('Selecione pelo menos um aluno');
      }

      // Criar a carta EXCLUSIVA (is_special=true, available=false)
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          name: formData.name,
          description: formData.description,
          rarity: formData.rarity,
          price: formData.price,
          image_url: formData.image_url,
          available: false, // ❌ NÃO disponível na loja
          is_special: true, // ✅ Marcada como especial
          copies_available: null, // Ilimitada para os alunos selecionados
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // Distribuir carta para alunos selecionados
      const userCards = selectedStudents.map(studentId => ({
        user_id: studentId,
        card_id: card.id,
        quantity: 1
      }));

      const { error: assignError } = await supabase
        .from('user_cards')
        .upsert(userCards, {
          onConflict: 'user_id,card_id'
        });

      if (assignError) throw assignError;

      return card;
    },
    onSuccess: () => {
      toast.success('Carta especial criada e distribuída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['user-cards'] });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        rarity: 'common',
        price: 0,
        image_url: '',
      });
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar carta especial');
    }
  });

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Criar Carta Especial para Alunos
        </CardTitle>
        <CardDescription>
          Crie uma carta exclusiva e distribua para alunos específicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="special-name">Nome da Carta *</Label>
              <Input
                id="special-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome único da carta"
              />
            </div>

            <div>
              <Label htmlFor="special-description">Descrição</Label>
              <Textarea
                id="special-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da carta especial"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="special-rarity">Raridade</Label>
              <Select
                value={formData.rarity}
                onValueChange={(value: any) => setFormData({ ...formData, rarity: value })}
              >
                <SelectTrigger id="special-rarity">
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
              <Label htmlFor="special-price">Preço (moedas)</Label>
              <Input
                id="special-price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
              />
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
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.includes(student.id)
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-muted hover:bg-muted/80 border-2 border-transparent'
                  }`}
                  onClick={() => toggleStudent(student.id)}
                >
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
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
          onClick={() => createSpecialCard.mutate()}
          disabled={!formData.name || selectedStudents.length === 0 || createSpecialCard.isPending}
          className="w-full"
          size="lg"
        >
          {createSpecialCard.isPending ? 'Criando...' : 'Criar e Distribuir Carta Especial'}
        </Button>
      </CardContent>
    </Card>
  );
}
