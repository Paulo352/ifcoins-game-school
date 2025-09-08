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
import { RotateCcw, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function SystemResetButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleSystemReset = async () => {
    if (confirmText !== 'RESETAR SISTEMA') {
      toast({
        title: "Confirmação inválida",
        description: "Digite exatamente 'RESETAR SISTEMA' para confirmar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResetResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.functions.invoke('admin-reset-system', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setResetResult(data);
      
      if (data.success) {
        toast({
          title: "Sistema Resetado!",
          description: data.message,
        });
      } else {
        toast({
          title: "Erro no Reset",
          description: "Alguns passos falharam durante o reset",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao resetar sistema:', error);
      toast({
        title: "Erro",
        description: "Falha ao resetar o sistema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setConfirmText('');
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações irreversíveis que afetam todo o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900">Atenção: Reset do Sistema</h4>
              <p className="text-sm text-red-700 mt-1">
                Esta ação irá:
              </p>
                  <ul className="text-sm text-red-700 mt-2 ml-4 space-y-1">
                <li>• Remover todas as cartas dos usuários</li>
                <li>• Deletar todas as cartas criadas no sistema</li>
                <li>• Zerar moedas de todos os usuários (volta para 100)</li>
                <li>• Limpar histórico de recompensas</li>
                <li>• Cancelar todas as trocas pendentes</li>
                <li>• <strong>Esta ação não pode ser desfeita!</strong></li>
              </ul>
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
              <div className="grid grid-cols-2 gap-2">
                {resetResult.resetSteps?.map((step: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="capitalize">{step.step.replace('_', ' ')}</span>
                    {step.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Resetando Sistema...' : 'Resetar Sistema Completo'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Reset do Sistema
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>
                    Você está prestes a <strong>resetar completamente</strong> o sistema. 
                    Esta ação irá:
                  </p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>✗ Remover todas as cartas dos usuários</li>
                    <li>✗ Deletar todas as cartas criadas no sistema</li>
                    <li>✗ Zerar todas as moedas (volta para 100)</li>
                    <li>✗ Limpar histórico de recompensas</li>
                    <li>✗ Cancelar todas as trocas</li>
                  </ul>
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-900">
                      ⚠️ Esta ação é IRREVERSÍVEL!
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Para confirmar, digite: <Badge variant="destructive">RESETAR SISTEMA</Badge>
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      placeholder="Digite exatamente: RESETAR SISTEMA"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                    />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmText('')}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleSystemReset}
                disabled={confirmText !== 'RESETAR SISTEMA' || isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Confirmar Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}