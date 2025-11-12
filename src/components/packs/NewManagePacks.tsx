import React, { useState } from 'react';
import { usePacks, useDeletePack, useUpdatePack } from '@/hooks/packs/usePacks';
import { NewPackForm } from './NewPackForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, Trash2, Plus, Coins, Users, TrendingUp, Sparkles, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function NewManagePacks() {
  const [showForm, setShowForm] = useState(false);
  const [editingPack, setEditingPack] = useState<any | null>(null);
  const { data: packs, isLoading } = usePacks();
  const deletePack = useDeletePack();
  const updatePack = useUpdatePack();

  const handleToggleAvailability = (packId: string, available: boolean) => {
    updatePack.mutate({ id: packId, available });
  };

  const handleDeletePack = (packId: string) => {
    deletePack.mutate(packId);
  };

  const getPackTypeIcon = (type: string) => {
    return type === 'random' ? '🎲' : '📦';
  };

  const getPackTypeColor = (type: string) => {
    return type === 'random' ? 'from-purple-500/20 to-pink-500/20' : 'from-emerald-500/20 to-teal-500/20';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-muted-foreground">Carregando pacotes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-3">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Gerenciamento</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Pacotes de Cartas</h2>
          <p className="text-muted-foreground">
            Crie e gerencie pacotes para expandir a experiência dos estudantes
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Ocultar Formulário' : 'Criar Pacote'}
        </Button>
      </div>

      {/* Stats Overview */}
      {packs && packs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Pacotes</p>
                  <p className="text-3xl font-bold">{packs.length}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Disponíveis</p>
                  <p className="text-3xl font-bold">
                    {packs.filter(p => p.available).length}
                  </p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Aleatórios</p>
                  <p className="text-3xl font-bold">
                    {packs.filter(p => p.pack_type === 'random').length}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-full">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <NewPackForm 
            editingPack={editingPack} 
            onSuccess={() => {
              setShowForm(false);
              setEditingPack(null);
            }} 
          />
        </div>
      )}

      {/* Packs List */}
      {!packs || packs.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-16">
            <div className="relative inline-block mb-6">
              <Package className="w-20 h-20 text-muted-foreground/50" />
              <div className="absolute -top-2 -right-2 bg-background rounded-full p-2 shadow-lg">
                <Plus className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-3">Nenhum pacote criado</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Crie seu primeiro pacote para oferecer aos estudantes uma forma divertida de expandir suas coleções.
            </p>
            <Button onClick={() => setShowForm(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Pacote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {packs.map((pack) => (
            <Card 
              key={pack.id}
              className={cn(
                "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-lg"
              )}
            >
              {/* Background gradient */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-30",
                getPackTypeColor(pack.pack_type)
              )} />

              <CardHeader className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg">
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-2xl">
                          {getPackTypeIcon(pack.pack_type)} {pack.name}
                        </CardTitle>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={pack.pack_type === 'random' ? 'default' : 'secondary'}>
                          {pack.pack_type === 'random' ? 'Aleatório' : 'Fixo'}
                        </Badge>
                        <Badge variant={pack.available ? 'default' : 'outline'}>
                          {pack.available ? '✓ Disponível' : '⏸ Indisponível'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                      <span className="text-sm text-muted-foreground">Disponível:</span>
                      <Switch
                        checked={pack.available}
                        onCheckedChange={(checked) => handleToggleAvailability(pack.id, checked)}
                        disabled={updatePack.isPending}
                      />
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => {
                            setEditingPack(pack);
                            setShowForm(true);
                          }}
                          className="hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar pacote</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o pacote <strong>"{pack.name}"</strong>? 
                            Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePack(pack.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Excluir Pacote
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir pacote</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Price */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Coins className="w-4 h-4" />
                      <span className="text-sm">Preço</span>
                    </div>
                    <p className="text-2xl font-bold">{pack.price} moedas</p>
                  </div>

                  {/* Limit */}
                  <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Limite</span>
                    </div>
                    <p className="text-2xl font-bold">{pack.limit_per_student} por aluno</p>
                  </div>

                  {/* Probabilities for Random */}
                  {pack.pack_type === 'random' && (
                    <>
                      <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4">
                        <span className="text-sm text-muted-foreground">Probabilidades</span>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Comum:</span>
                            <span className="font-bold">{pack.probability_common}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Rara:</span>
                            <span className="font-bold">{pack.probability_rare}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-background/60 backdrop-blur-sm rounded-lg p-4">
                        <span className="text-sm text-muted-foreground">Raridades Especiais</span>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Lendária:</span>
                            <span className="font-bold">{pack.probability_legendary}%</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Mítica:</span>
                            <span className="font-bold">{pack.probability_mythic}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fixed pack info */}
                  {pack.pack_type === 'fixed' && (
                    <div className="md:col-span-2 bg-background/60 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground text-center">
                        ✨ Este pacote contém cartas específicas pré-definidas
                      </p>
                    </div>
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
