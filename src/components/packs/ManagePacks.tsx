import React, { useState } from 'react';
import { usePacks, useDeletePack, useUpdatePack } from '@/hooks/packs/usePacks';
import { PackForm } from './PackForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, Trash2, Edit, Plus } from 'lucide-react';

export function ManagePacks() {
  const [showForm, setShowForm] = useState(false);
  const { data: packs, isLoading } = usePacks();
  const deletePack = useDeletePack();
  const updatePack = useUpdatePack();

  const handleToggleAvailability = (packId: string, available: boolean) => {
    updatePack.mutate({ id: packId, available });
  };

  const handleDeletePack = (packId: string) => {
    deletePack.mutate(packId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Pacotes</h2>
          <p className="text-muted-foreground">
            Crie e gerencie pacotes de cartas para os estudantes
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Ocultar Formulário' : 'Novo Pacote'}
        </Button>
      </div>

      {showForm && (
        <PackForm onSuccess={() => setShowForm(false)} />
      )}

      {!packs || packs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhum pacote criado</h3>
            <p className="text-muted-foreground">
              Crie seu primeiro pacote para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {packs.map((pack) => (
            <Card key={pack.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{pack.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={pack.pack_type === 'random' ? 'default' : 'secondary'}>
                          {pack.pack_type === 'random' ? 'Aleatório' : 'Fixo'}
                        </Badge>
                        <Badge variant={pack.available ? 'default' : 'secondary'}>
                          {pack.available ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Disponível:</span>
                      <Switch
                        checked={pack.available}
                        onCheckedChange={(checked) => handleToggleAvailability(pack.id, checked)}
                        disabled={updatePack.isPending}
                      />
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o pacote "{pack.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePack(pack.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Preço:</span>
                    <p className="font-medium">{pack.price} moedas</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Limite:</span>
                    <p className="font-medium">{pack.limit_per_student} por estudante</p>
                  </div>
                  {pack.pack_type === 'random' && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Comum:</span>
                        <p className="font-medium">{pack.probability_common}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rara:</span>
                        <p className="font-medium">{pack.probability_rare}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lendária:</span>
                        <p className="font-medium">{pack.probability_legendary}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Mítica:</span>
                        <p className="font-medium">{pack.probability_mythic}%</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}