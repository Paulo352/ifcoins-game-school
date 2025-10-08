import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
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
    id: 'events',
    label: 'Eventos Completos',
    description: 'Remove TODOS os eventos e suas dependências (polls, votações, cartas associadas)',
    action: 'delete_events',
    danger: 'high'
  },
  {
    id: 'packs_system',
    label: 'Sistema de Pacotes',
    description: 'Remove TODOS os pacotes e suas dependências (cartas associadas, histórico de compras)',
    action: 'delete_packs',
    danger: 'high'
  },
  {
    id: 'quizzes_system',
    label: 'Sistema de Quizzes',
    description: 'Remove TODOS os quizzes e suas dependências (perguntas, tentativas, respostas)',
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
    description: 'Deleta todas as cartas criadas no sistema',
    action: 'delete_cards',
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
    description: 'Limpa apenas o histórico de compras de pacotes (mantém os pacotes)',
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

export function SelectiveResetButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [resetResult, setResetResult] = useState<any>(null);
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

      const results = [];

      for (const optionId of selectedOptions) {
        const option = RESET_OPTIONS.find(o => o.id === optionId);
        if (!option) continue;

        try {
          switch (option.action) {
            case 'delete_events':
              // Deletar eventos e suas dependências na ordem correta
              // 1. Primeiro os votos
              const { data: eventPolls } = await supabase
                .from('polls')
                .select('id')
                .not('event_id', 'is', null);
              
              if (eventPolls && eventPolls.length > 0) {
                const pollIds = eventPolls.map(p => p.id);
                await supabase.from('poll_votes').delete().in('poll_id', pollIds);
                await supabase.from('poll_options').delete().in('poll_id', pollIds);
              }
              
              // 2. Depois as polls
              await supabase.from('polls').delete().not('event_id', 'is', null);
              
              // 3. Event cards
              await supabase.from('event_cards').delete().neq('event_id', '00000000-0000-0000-0000-000000000000');
              
              // 4. Finalmente os eventos
              await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_packs':
              // Deletar pacotes e suas dependências na ordem correta
              await supabase.from('pack_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('pack_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('packs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_quizzes':
              // Deletar quizzes e suas dependências
              await supabase.from('quiz_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('quiz_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('quiz_questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_polls':
              // Deletar apenas polls independentes (sem event_id)
              const { data: independentPolls } = await supabase
                .from('polls')
                .select('id')
                .is('event_id', null);
              
              if (independentPolls && independentPolls.length > 0) {
                const pollIds = independentPolls.map(p => p.id);
                await supabase.from('poll_votes').delete().in('poll_id', pollIds);
                await supabase.from('poll_options').delete().in('poll_id', pollIds);
                await supabase.from('polls').delete().in('id', pollIds);
              }
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_user_cards':
              await supabase.from('user_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_cards':
              // Primeiro remover dependências
              await supabase.from('user_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('pack_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('event_cards').delete().neq('card_id', '00000000-0000-0000-0000-000000000000');
              // Depois deletar as cartas
              await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'reset_coins':
              await supabase
                .from('profiles')
                .update({ coins: 100 })
                .neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_reward_logs':
              await supabase.from('reward_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_trades':
              await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_pack_purchases':
              await supabase.from('pack_purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            case 'delete_notifications':
              await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              results.push({ step: option.label, status: 'success' });
              break;

            default:
              throw new Error(`Ação desconhecida: ${option.action}`);
          }
        } catch (error) {
          console.error(`Erro ao resetar ${option.label}:`, error);
          results.push({ step: option.label, status: 'error', error: String(error) });
        }
      }

      const allSuccess = results.every(r => r.status === 'success');
      
      setResetResult({
        success: allSuccess,
        message: allSuccess 
          ? `Reset concluído com sucesso! ${results.length} ações executadas.`
          : 'Alguns itens falharam no reset',
        resetSteps: results,
        timestamp: new Date().toISOString()
      });

      if (allSuccess) {
        toast.success(`Reset concluído! ${results.length} itens resetados.`);
      } else {
        toast.error('Alguns itens falharam no reset. Verifique os detalhes.');
      }

    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      toast.error('Falha ao resetar o sistema. Tente novamente.');
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
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">Risco Médio</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs">Baixo Risco</Badge>;
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo - Reset Seletivo
        </CardTitle>
        <CardDescription>
          Escolha exatamente o que deseja resetar no sistema. Eventos e Pacotes serão deletados com todas as suas dependências.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900">⚠️ Atenção: Reset Seletivo</h4>
              <p className="text-sm text-red-700 mt-1">
                Selecione apenas os itens que deseja resetar. Esta ação é IRREVERSÍVEL para os itens selecionados.
              </p>
              <p className="text-xs text-red-600 mt-2">
                <strong>Importante:</strong> Ao deletar Eventos ou Pacotes, TODAS as dependências (polls, compras, etc) também serão removidas automaticamente.
              </p>
            </div>
          </div>
        </div>

        {resetResult && (
          <Card className={resetResult.success ? "border-green-200" : "border-red-200"}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm ${resetResult.success ? "text-green-700" : "text-red-700"}`}>
                Resultado do Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {resetResult.resetSteps?.map((step: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="text-xs">{step.step}</span>
                    {step.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Executado em: {resetResult.timestamp ? new Date(resetResult.timestamp).toLocaleString('pt-BR') : 'N/A'}
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
              Resetar Itens Selecionados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
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

                    {RESET_OPTIONS.map((option) => (
                      <div 
                        key={option.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          selectedOptions.includes(option.id) 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={option.id}
                          checked={selectedOptions.includes(option.id)}
                          onCheckedChange={() => handleToggleOption(option.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
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
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        ⚠️ Você selecionou {selectedOptions.length} item(ns) para reset
                      </p>
                      <p className="text-xs text-red-700">
                        Esta ação é IRREVERSÍVEL!
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Para confirmar, digite: <Badge variant="destructive">RESETAR</Badge>
                    </Label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Digite: RESETAR"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setConfirmText('');
                setIsDialogOpen(false);
              }}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSelectiveReset}
                disabled={confirmText !== 'RESETAR' || isLoading || selectedOptions.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetando...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Confirmar Reset ({selectedOptions.length})
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}