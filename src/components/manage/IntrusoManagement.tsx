import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserCog, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Profile } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface IntrusoManagementProps {
  users: Profile[];
  onSuccess: () => void;
}

export function IntrusoManagement({ users, onSuccess }: IntrusoManagementProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um intruso e o papel a ser atribuído",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.rpc('update_user_role_secure', {
        target_user_id: selectedUser,
        new_role: selectedRole as 'student' | 'teacher' | 'admin',
        reason: 'Role assigned to intruso by admin'
      });

      if (error) throw error;

      const userName = users.find(u => u.id === selectedUser)?.name || 'Usuário';
      const roleLabel = selectedRole === 'student' ? 'Estudante' : selectedRole === 'teacher' ? 'Professor' : 'Administrador';
      
      toast({
        title: "Papel atribuído!",
        description: `${userName} agora é ${roleLabel}`,
      });
      
      setSelectedUser('');
      setSelectedRole('');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atribuir papel:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atribuir o papel",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum intruso encontrado no sistema.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de Intrusos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Lista de Intrusos
          </CardTitle>
          <CardDescription>
            Usuários que se registraram com e-mails não institucionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Data de Registro</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">Intruso</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Atribuir Papel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Atribuir Papel ao Intruso
          </CardTitle>
          <CardDescription>
            Converta um intruso em estudante, professor ou administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Selecione o Intruso</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um intruso" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Novo Papel</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudante</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                disabled={!selectedUser || !selectedRole || updating}
                className="w-full md:w-auto"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atribuindo...
                  </>
                ) : (
                  <>
                    <UserCog className="mr-2 h-4 w-4" />
                    Atribuir Papel
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Atribuição de Papel</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a converter{' '}
                  <strong>{users.find(u => u.id === selectedUser)?.name}</strong> de intruso para{' '}
                  <strong>
                    {selectedRole === 'student' ? 'Estudante' : selectedRole === 'teacher' ? 'Professor' : 'Administrador'}
                  </strong>.
                  <br /><br />
                  O usuário terá acesso completo ao sistema com as permissões do novo papel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleAssignRole}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
