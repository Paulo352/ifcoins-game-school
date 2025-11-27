import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, UserCog, Trash2, Shield, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateCoins } from '@/hooks/useUpdateCoins';
import { Profile } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AdminManageUsersProps {
  users: Profile[] | undefined;
  adminId: string;
  onSuccess: () => void;
}

export function AdminManageUsers({ users, adminId, onSuccess }: AdminManageUsersProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [coinsAmount, setCoinsAmount] = useState('');
  const [reason, setReason] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserForRole, setSelectedUserForRole] = useState('');
  const [selectedUserForDelete, setSelectedUserForDelete] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Estados para alterar senha
  const [selectedPasswordUser, setSelectedPasswordUser] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estados para criar usuário
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRA, setNewUserRA] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [newUserClass, setNewUserClass] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const { giveCoins, loading } = useUpdateCoins();

  const handleGiveCoins = async () => {
    if (!selectedUser || !coinsAmount || !reason) {
      toast.error('Preencha todos os campos para dar/retirar moedas');
      return;
    }

    const amount = parseInt(coinsAmount);
    if (amount === 0) {
      toast.error('A quantidade deve ser diferente de zero');
      return;
    }

    const selectedUserName = users?.find(u => u.id === selectedUser)?.name || 'Usuário';
    
    const success = await giveCoins(selectedUser, amount, reason, adminId, selectedUserName);
    
    if (success) {
      setSelectedUser('');
      setCoinsAmount('');
      setReason('');
      onSuccess();
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForRole || !selectedRole) {
      toast.error('Selecione um usuário e o novo papel');
      return;
    }

    setUpdating(true);
    try {
      // Use the secure role update function
      const { data, error } = await supabase.rpc('update_user_role_secure', {
        target_user_id: selectedUserForRole,
        new_role: selectedRole as 'student' | 'teacher' | 'admin',
        reason: 'Role updated by admin via management interface'
      });

      if (error) throw error;

      const selectedUserName = users?.find(u => u.id === selectedUserForRole)?.name || 'Usuário';
      
      toast.success(`${selectedUserName} agora é ${selectedRole === 'admin' ? 'Administrador' : selectedRole === 'teacher' ? 'Professor' : 'Estudante'}`);
      
      setSelectedUserForRole('');
      setSelectedRole('');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao atualizar papel:', error);
      toast.error(error.message || 'Não foi possível atualizar o papel do usuário');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedPasswordUser) {
      toast.error('Selecione um usuário');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-user-password', {
        body: { 
          userId: selectedPasswordUser,
          newPassword: newPassword
        }
      });

      if (error) throw error;

      if (data?.success) {
        const user = users?.find(u => u.id === selectedPasswordUser);
        toast.success(`Senha alterada para ${user?.name || 'usuário'}`);
        setSelectedPasswordUser('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data?.error || 'Erro ao alterar senha');
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      toast.error(error.message || 'Não foi possível alterar a senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserForDelete) return;

    setDeleting(true);
    try {
      // Call edge function to delete user from auth and profiles
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: selectedUserForDelete }
      });

      if (error) throw error;

      const deletedUserName = users?.find(u => u.id === selectedUserForDelete)?.name || 'Usuário';
      
      toast.success(`${deletedUserName} foi removido completamente do sistema`);
      
      setSelectedUserForDelete('');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Não foi possível remover o usuário');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsCreatingUser(true);
    try {
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        password: newUserPassword,
        email_confirm: true,
        user_metadata: {
          name: newUserName,
          ra: newUserRA || null,
          class: newUserClass || null
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Falha ao criar usuário');
      }

      // Criar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          ra: newUserRA || null,
          class: newUserClass || null,
          coins: 0
        });

      if (profileError) throw profileError;

      toast.success(`Conta criada com sucesso para ${newUserName}`);
      
      // Limpar campos
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRA('');
      setNewUserRole('student');
      setNewUserClass('');
      
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || 'Não foi possível criar o usuário');
    } finally {
      setIsCreatingUser(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Gerenciar Moedas IFCoins
          </CardTitle>
          <CardDescription>
            Dê ou retire moedas de qualquer usuário (sem limites)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user">Usuário</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coins">Quantidade de Moedas</Label>
              <Input
                id="coins"
                type="number"
                placeholder="100 (use valores negativos para retirar)"
                value={coinsAmount}
                onChange={(e) => setCoinsAmount(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Use valores positivos para dar moedas ou negativos para retirar
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Recompensa por projeto especial ou Remoção por violação das regras"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGiveCoins}
              className="bg-ifpr-green hover:bg-ifpr-green-dark"
              disabled={loading}
            >
              <Coins className="h-4 w-4 mr-2" />
              {loading ? 'Processando...' : 'Aplicar Moedas'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Alterar Papel do Usuário
          </CardTitle>
          <CardDescription>
            Mude o papel de qualquer usuário (Admin, Professor, Estudante)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role-user">Usuário</Label>
              <Select value={selectedUserForRole} onValueChange={setSelectedUserForRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Novo Papel</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Estudante</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleUpdateRole}
            variant="outline"
            disabled={updating}
          >
            <UserCog className="h-4 w-4 mr-2" />
            {updating ? 'Atualizando...' : 'Atualizar Papel'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            Alterar Senha do Usuário
          </CardTitle>
          <CardDescription>
            Defina uma nova senha para qualquer usuário do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password-user-select">Usuário</Label>
              <Select value={selectedPasswordUser} onValueChange={setSelectedPasswordUser}>
                <SelectTrigger id="password-user-select">
                  <SelectValue placeholder="Escolha um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={!selectedPasswordUser || isChangingPassword}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a senha novamente"
              disabled={!selectedPasswordUser || isChangingPassword}
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={!selectedPasswordUser || !newPassword || !confirmPassword || isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Alterando senha...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar alteração de senha</AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a alterar a senha de{' '}
                  <strong>{users?.find(u => u.id === selectedPasswordUser)?.name}</strong>.
                  Esta ação será registrada nos logs de segurança. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleChangePassword}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Remover Usuário
          </CardTitle>
          <CardDescription>
            Remove permanentemente um usuário do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-user">Usuário</Label>
            <Select value={selectedUserForDelete} onValueChange={setSelectedUserForDelete}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário para remover" />
              </SelectTrigger>
              <SelectContent>
                {users?.filter(user => user.id !== adminId).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.role} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive"
                disabled={!selectedUserForDelete || deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Removendo...' : 'Remover Usuário'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover este usuário? Esta ação é irreversível e todos os dados do usuário serão perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Criar Nova Conta
          </CardTitle>
          <CardDescription>
            Crie contas de alunos ou professores diretamente pelo painel admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Nome Completo *</Label>
              <Input
                id="new-user-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Ex: João Silva"
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email *</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="usuario@email.com"
                disabled={isCreatingUser}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Senha *</Label>
              <Input
                id="new-user-password"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Papel *</Label>
              <Select 
                value={newUserRole} 
                onValueChange={(value: 'student' | 'teacher' | 'admin') => setNewUserRole(value)}
                disabled={isCreatingUser}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-ra">RA (Opcional)</Label>
              <Input
                id="new-user-ra"
                value={newUserRA}
                onChange={(e) => setNewUserRA(e.target.value)}
                placeholder="Registro Acadêmico"
                disabled={isCreatingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-class">Turma (Opcional)</Label>
              <Input
                id="new-user-class"
                value={newUserClass}
                onChange={(e) => setNewUserClass(e.target.value)}
                placeholder="Ex: 3º Ano A"
                disabled={isCreatingUser}
              />
            </div>
          </div>

          <Button
            onClick={handleCreateUser}
            disabled={isCreatingUser}
            className="w-full"
          >
            {isCreatingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Conta
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}