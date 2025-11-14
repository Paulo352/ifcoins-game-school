import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileEditProps {
  user: Profile;
  onSuccess: () => void;
  canEdit: boolean;
}

export function UserProfileEdit({ user, onSuccess, canEdit }: UserProfileEditProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    ra: user.ra || '',
    class: user.class || '',
    newPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setLoading(true);
    try {
      // Atualizar perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          ra: formData.ra || null,
          class: formData.class || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Se uma nova senha foi fornecida, resetá-la
      if (formData.newPassword && formData.newPassword.trim() !== '') {
        if (formData.newPassword.length < 6) {
          toast({
            title: "Erro",
            description: "A senha deve ter pelo menos 6 caracteres.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Não autenticado');
        }

        const response = await fetch(
          `https://bcopgknrpjenixejhlfz.supabase.co/functions/v1/admin-reset-user-password`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              userId: user.id,
              newPassword: formData.newPassword,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao alterar senha');
        }
      }

      toast({
        title: "Perfil atualizado!",
        description: formData.newPassword 
          ? "As informações do usuário e a senha foram atualizadas com sucesso."
          : "As informações do usuário foram atualizadas com sucesso.",
      });

      setIsOpen(false);
      setFormData(prev => ({ ...prev, newPassword: '' }));
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o perfil do usuário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil do Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ra">RA</Label>
              <Input
                id="ra"
                value={formData.ra}
                onChange={(e) => handleInputChange('ra', e.target.value)}
                placeholder="Registro Acadêmico"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Turma</Label>
              <Input
                id="class"
                value={formData.class}
                onChange={(e) => handleInputChange('class', e.target.value)}
                placeholder="Turma do aluno"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha (opcional)</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="Digite uma nova senha (mín. 6 caracteres)"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco se não quiser alterar a senha
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Informações do usuário:</strong><br/>
              Email: {user.email}<br/>
              Tipo: {user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Professor' : 'Estudante'}<br/>
              IFCoins: {user.coins}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}