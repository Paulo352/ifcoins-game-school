import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, UserCog, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
  const { giveCoins, loading } = useUpdateCoins();

  const handleGiveCoins = async () => {
    if (!selectedUser || !coinsAmount || !reason) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para dar/retirar moedas",
        variant: "destructive"
      });
      return;
    }

    const amount = parseInt(coinsAmount);
    if (amount === 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser diferente de zero",
        variant: "destructive"
      });
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
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um usuário e o novo papel",
        variant: "destructive"
      });
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
      
      toast({
        title: "Papel atualizado com segurança!",
        description: `${selectedUserName} agora é ${selectedRole === 'admin' ? 'Administrador' : selectedRole === 'teacher' ? 'Professor' : 'Estudante'}`,
      });
      
      setSelectedUserForRole('');
      setSelectedRole('');
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar papel:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o papel do usuário",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
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
      
      toast({
        title: "Usuário removido!",
        description: `${deletedUserName} foi removido completamente do sistema`,
      });
      
      setSelectedUserForDelete('');
      onSuccess();
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
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
    </div>
  );
}