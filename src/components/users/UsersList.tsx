import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';
import { AvatarUploadResult } from '@/hooks/storage/useAvatarUpload';
import { useAuth } from '@/contexts/AuthContext';

interface UsersListProps {
  onAvatarUpload: (file: File, userId: string) => Promise<AvatarUploadResult | null>;
  onAvatarDelete: (userId: string, avatarPath?: string) => Promise<boolean>;
  isUploading: boolean;
}

export function UsersList({ onAvatarUpload, onAvatarDelete, isUploading }: UsersListProps) {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAvatarUpload = async (userId: string, file: File) => {
    const result = await onAvatarUpload(file, userId);
    if (result) {
      fetchUsers(); // Recarregar lista
    }
  };

  const handleAvatarDelete = async (userId: string, avatarUrl?: string) => {
    const success = await onAvatarDelete(userId, avatarUrl);
    if (success) {
      fetchUsers(); // Recarregar lista
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.ra && user.ra.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'destructive' as const,
      teacher: 'default' as const,
      student: 'secondary' as const,
    };
    
    const labels = {
      admin: 'Administrador',
      teacher: 'Professor',
      student: 'Estudante',
    };

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'secondary'}>
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou RA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredUsers.map((user) => {
          const isCurrentUser = currentProfile?.id === user.id;
          
          return (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {user.name[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      {getRoleBadge(user.role)}
                      {isCurrentUser && (
                        <Badge variant="outline">Você</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Email: {user.email}</p>
                      {user.ra && <p>RA: {user.ra}</p>}
                      {user.class && <p>Turma: {user.class}</p>}
                      <p>IFCoins: {user.coins}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Upload de avatar - disponível para todos */}
                    <div>
                      <input
                        ref={(el) => (fileInputRefs.current[user.id] = el)}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleAvatarUpload(user.id, file);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRefs.current[user.id]?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {user.avatar_url ? 'Alterar Foto' : 'Adicionar Foto'}
                      </Button>
                    </div>

                    {/* Remover avatar - apenas admin pode remover fotos de outros */}
                    {user.avatar_url && (currentProfile?.role === 'admin' || isCurrentUser) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAvatarDelete(user.id, user.avatar_url || undefined)}
                        disabled={isUploading}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Foto
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhum usuário encontrado.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
