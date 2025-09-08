
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { Profile } from '@/types/supabase';
import { UserProfileEdit } from './UserProfileEdit';
import { useAuth } from '@/contexts/AuthContext';

interface UsersTableProps {
  users: Profile[] | undefined;
  onRefresh?: () => void;
}

export function UsersTable({ users, onRefresh }: UsersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuth();

  const filteredUsers = users?.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.ra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.class?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Usuários Cadastrados</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>RA/Turma</TableHead>
              <TableHead>IFCoins</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const canEdit = profile && (profile.role === 'admin' || 
                (profile.role === 'teacher' && user.role === 'student'));
              
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'teacher' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 
                       user.role === 'teacher' ? 'Professor' : 'Estudante'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.ra ? (
                        <div className="text-sm">RA: {user.ra}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">RA não informado</div>
                      )}
                      {user.class ? (
                        <div className="text-sm">Turma: {user.class}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">Turma não informada</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-primary">{user.coins}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <UserProfileEdit 
                      user={user} 
                      onSuccess={onRefresh || (() => {})} 
                      canEdit={Boolean(canEdit)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
