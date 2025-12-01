import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Upload, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarUpload } from '@/hooks/storage/useAvatarUpload';
import { Profile } from '@/types/supabase';
import { UsersList } from './UsersList';

export function UserManagement() {
  const { profile } = useAuth();
  const { uploadAvatar, deleteAvatar, isUploading } = useAvatarUpload();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    ra: '',
    class: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || profile.role !== 'admin') {
      toast({
        title: "Erro",
        description: "Apenas administradores podem criar usuários",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(`https://bcopgknrpjenixejhlfz.supabase.co/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          ra: newUser.ra || null,
          class: newUser.class || null,
          role: newUser.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      toast({
        title: "Usuário criado!",
        description: `${newUser.name} foi adicionado como ${newUser.role === 'admin' ? 'administrador' : newUser.role === 'teacher' ? 'professor' : 'estudante'}.`,
      });

      setIsCreateDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        ra: '',
        class: '',
        role: 'student',
      });
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o usuário.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Crie e gerencie contas de usuários do sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Conta *</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'student' | 'teacher' | 'admin') => 
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Estudante</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ra">RA</Label>
                  <Input
                    id="ra"
                    value={newUser.ra}
                    onChange={(e) => setNewUser({ ...newUser, ra: e.target.value })}
                    placeholder="Registro Acadêmico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Turma</Label>
                  <Input
                    id="class"
                    value={newUser.class}
                    onChange={(e) => setNewUser({ ...newUser, class: e.target.value })}
                    placeholder="Turma"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <UsersList 
        key={refreshKey}
        onAvatarUpload={uploadAvatar}
        onAvatarDelete={deleteAvatar}
        isUploading={isUploading}
      />
    </div>
  );
}
