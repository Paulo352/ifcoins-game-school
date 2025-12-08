import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RotateCcw, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ResetOption {
  id: string;
  label: string;
  description: string;
  action: string;
  danger: 'high' | 'medium' | 'low';
}

const RESET_OPTIONS: ResetOption[] = [
  {
    id: 'bank',
    label: 'IFBank (Sistema Bancário)',
    description: 'Reseta empréstimos, transações e volta banco ao estado inicial',
    action: 'reset_bank',
    danger: 'high'
  },
  {
    id: 'events',
    label: 'Eventos Completos',
    description: 'Remove TODOS os eventos e suas dependências (polls, votações)',
    action: 'delete_events',
    danger: 'high'
  },
  {
    id: 'packs_system',
    label: 'Sistema de Pacotes',
    description: 'Remove TODOS os pacotes e histórico de compras',
    action: 'delete_packs',
    danger: 'high'
  },
  {
    id: 'quizzes_system',
    label: 'Sistema de Quizzes',
    description: 'Remove TODOS os quizzes, perguntas, tentativas e respostas',
    action: 'delete_quizzes',
    danger: 'high'
  },
  {
    id: 'polls',
    label: 'Votações (Polls)',
    description: 'Remove TODAS as votações independentes (não associadas a eventos)',
    action: 'delete_polls',
    danger: 'high'
  },
  {
    id: 'user_cards',
    label: 'Cartas dos Usuários',
    description: 'Remove todas as cartas das coleções dos usuários',
    action: 'delete_user_cards',
    danger: 'high'
  },
  {
    id: 'cards',
    label: 'Cartas do Sistema',
    description: 'Deleta TODAS as cartas criadas (e cartas dos usuários)',
    action: 'delete_cards',
    danger: 'high'
  },
  {
    id: 'multiplayer',
    label: 'Sistema Multiplayer',
    description: 'Remove salas multiplayer, histórico de partidas e chat',
    action: 'delete_multiplayer',
    danger: 'high'
  },
  {
    id: 'mentorships',
    label: 'Sistema de Mentoria',
    description: 'Remove todas as mentorias, atividades e avaliações',
    action: 'delete_mentorships',
    danger: 'high'
  },
  {
    id: 'classes',
    label: 'Sistema de Turmas',
    description: 'Remove todas as turmas, alunos, convites e mensagens',
    action: 'delete_classes',
    danger: 'high'
  },
  {
    id: 'badges',
    label: 'Sistema de Badges',
    description: 'Remove badges personalizadas e progresso dos usuários',
    action: 'delete_badges',
    danger: 'high'
  },
  {
    id: 'coins',
    label: 'Moedas dos Usuários',
    description: 'Reseta moedas de todos os usuários para 100',
    action: 'reset_coins',
    danger: 'medium'
  },
  {
    id: 'reward_logs',
    label: 'Histórico de Recompensas',
    description: 'Limpa todo o histórico de recompensas dos professores',
    action: 'delete_reward_logs',
    danger: 'medium'
  },
  {
    id: 'trades',
    label: 'Trocas',
    description: 'Remove todas as trocas (pendentes, aceitas e recusadas)',
    action: 'delete_trades',
    danger: 'low'
  },
  {
    id: 'pack_purchases',
    label: 'Histórico de Compras',
    description: 'Limpa apenas o histórico de compras de pacotes',
    action: 'delete_pack_purchases',
    danger: 'low'
  },
  {
    id: 'notifications',
    label: 'Notificações',
    description: 'Remove todas as notificações do sistema',
    action: 'delete_notifications',
    danger: 'low'
  }
];

interface ResetResult {
  success: boolean;
  message: string;
  resetSteps: { step: string; status: 'success' | 'error'; error?: string }[];
  timestamp: string;
}

export function SelectiveResetButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleToggleOption = (optionId: string) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOptions.length === RESET_OPTIONS.length) {
      setSelectedOptions([]);
    } else {
      setSelectedOptions(RESET_OPTIONS.map(opt => opt.id));
    }
  };

  const handleSelectiveReset = async () => {
    if (confirmText !== 'RESETAR') {
      toast.error('Digite exatamente "RESETAR" para confirmar');
      return;
    }

    if (selectedOptions.length === 0) {
      toast.error('Selecione pelo menos uma opção para resetar');
      return;
    }

    setIsLoading(true);
    setResetResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Map selected options to actions
      const actions = selectedOptions.map(optionId => {
        const option = RESET_OPTIONS.find(o => o.id === optionId);
        return option?.action;
      }).filter(Boolean) as string[];

      console.log('Calling admin-selective-reset with actions:', actions);

      const { data, error } = await supabase.functions.invoke('admin-selective-reset', {
        body: {
          options: actions,
          confirmation: 'RESETAR'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Erro ao executar reset');
      }

      console.log('Reset result:', data);

      setResetResult(data);

      if (data.success) {
        toast.success(`Reset concluído! ${data.resetSteps?.length || 0} itens resetados.`);
      } else {
        toast.error('Alguns itens falharam no reset. Verifique os detalhes.');
      }

    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      toast.error('Falha ao resetar o sistema. Tente novamente.');
      setResetResult({
        success: false,
        message: String(error),
        resetSteps: [],
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
      setConfirmText('');
      setSelectedOptions([]);
      setIsDialogOpen(false);
    }
  };

  const getDangerBadge = (danger: string) => {
    switch (danger) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Alto Risco</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">Risco Médio</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Baixo Risco</Badge>;
    }
  };

  const selectedHighRisk = selectedOptions.filter(id => 
    RESET_OPTIONS.find(o => o.id === id)?.danger === 'high'
  ).length;

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo - Reset Seletivo
        </CardTitle>
        <CardDescription>
          Escolha exatamente o que deseja resetar no sistema. Esta ação é IRREVERSÍVEL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-destructive">⚠️ Atenção: Reset Seletivo</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione apenas os itens que deseja resetar. Esta ação é IRREVERSÍVEL.
              </p>
              <p className="text-xs text-destructive mt-2">
                <strong>Importante:</strong> Ao deletar alguns itens, suas dependências também serão removidas automaticamente.
              </p>
            </div>
          </div>
        </div>

        {resetResult && (
          <Card className={resetResult.success ? "border-green-500/50" : "border-destructive/50"}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm flex items-center gap-2 ${resetResult.success ? "text-green-600" : "text-destructive"}`}>
                {resetResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                Resultado do Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{resetResult.message}</p>
              {resetResult.resetSteps && resetResult.resetSteps.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                  {resetResult.resetSteps.map((step, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span className="text-xs truncate">{step.step}</span>
                      {step.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Executado em: {new Date(resetResult.timestamp).toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        )}

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Abrir Painel de Reset Seletivo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Reset Seletivo
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <p className="text-sm">
                    Selecione exatamente o que você deseja resetar. Apenas os itens marcados serão afetados.
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <Label className="text-base font-semibold">Opções de Reset</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        type="button"
                      >
                        {selectedOptions.length === RESET_OPTIONS.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                      </Button>
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2">
                      {RESET_OPTIONS.map((option) => (
                        <div 
                          key={option.id}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            selectedOptions.includes(option.id) 
                              ? 'bg-destructive/10 border-destructive/30' 
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          <Checkbox
                            id={option.id}
                            checked={selectedOptions.includes(option.id)}
                            onCheckedChange={() => handleToggleOption(option.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Label 
                                htmlFor={option.id}
                                className="font-medium cursor-pointer"
                              >
                                {option.label}
                              </Label>
                              {getDangerBadge(option.danger)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedOptions.length > 0 && (
                      <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                        <p className="text-sm font-medium text-destructive">
                          {selectedOptions.length} item(s) selecionado(s) 
                          {selectedHighRisk > 0 && ` (${selectedHighRisk} de alto risco)`}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="confirm-text" className="text-sm font-medium">
                        Digite <span className="font-mono text-destructive">RESETAR</span> para confirmar:
                      </Label>
                      <Input
                        id="confirm-text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="RESETAR"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleSelectiveReset}
                disabled={isLoading || confirmText !== 'RESETAR' || selectedOptions.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Confirmar Reset ({selectedOptions.length} itens)
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
