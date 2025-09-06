import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users, BarChart3, Settings } from 'lucide-react';
import { PollWithOptions, PollVote, usePollResults } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';

interface PollCardProps {
  poll: PollWithOptions;
  userVotes: PollVote[];
  onVote: (pollId: string, optionIds: string[]) => void;
  onDeactivate?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
  showResults?: boolean;
  voteLoading?: boolean;
}

export function PollCard({ 
  poll, 
  userVotes, 
  onVote, 
  onDeactivate, 
  onDelete,
  showResults = false,
  voteLoading = false 
}: PollCardProps) {
  const { profile } = useAuth();
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  
  // Limpar seleções quando voto for bem-sucedido
  React.useEffect(() => {
    if (!voteLoading) {
      // O voteLoading volta a false após o voto, então limpamos
      const timer = setTimeout(() => setSelectedOptions([]), 100);
      return () => clearTimeout(timer);
    }
  }, [voteLoading]);
  
  const isAdmin = profile?.role === 'admin';
  const isExpired = new Date(poll.end_date) < new Date();
  const hasUserVoted = userVotes.some(vote => vote.poll_id === poll.id);
  
  // Buscar resultados reais da votação
  const { data: pollResults = [] } = usePollResults(poll.id);
  
  // Calcular resultados com dados reais
  const totalVotes = pollResults.reduce((sum: number, result: any) => sum + Number(result.vote_count), 0);
  
  const resultsWithPercentage = pollResults.map((result: any) => ({
    ...result,
    percentage: totalVotes > 0 ? Math.round((Number(result.vote_count) / totalVotes) * 100) : 0
  }));

  const handleOptionChange = (optionId: string, checked: boolean) => {
    if (poll.allow_multiple_votes) {
      setSelectedOptions(prev => 
        checked 
          ? [...prev, optionId]
          : prev.filter(id => id !== optionId)
      );
    } else {
      setSelectedOptions(checked ? [optionId] : []);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(poll.id, selectedOptions);
    }
  };

  const getStatusBadge = () => {
    if (!poll.is_active) return <Badge variant="secondary">Inativa</Badge>;
    if (isExpired) return <Badge variant="destructive">Encerrada</Badge>;
    return <Badge variant="default">Ativa</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            {poll.description && (
              <p className="text-sm text-muted-foreground">{poll.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {isAdmin && (
              <div className="flex gap-1">
                {poll.is_active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeactivate?.(poll.id)}
                    title="Desativar votação"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(poll.id)}
                  className="text-destructive hover:text-destructive"
                  title="Deletar votação permanentemente"
                >
                  🗑️
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Até {new Date(poll.end_date).toLocaleDateString('pt-BR')}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {totalVotes} votos
          </div>
          {poll.allow_multiple_votes && (
            <Badge variant="outline" className="text-xs">
              Múltipla escolha
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {showResults || hasUserVoted || isExpired || !poll.is_active ? (
          // Mostrar resultados
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Resultados</span>
            </div>
            {resultsWithPercentage.map((result: any) => (
              <div key={result.option_id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{result.option_text}</span>
                  <span className="text-muted-foreground">
                    {result.vote_count} votos ({result.percentage}%)
                  </span>
                </div>
                <Progress value={result.percentage} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          // Mostrar opções para votar
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {poll.allow_multiple_votes 
                ? 'Selecione uma ou mais opções:' 
                : 'Selecione uma opção:'
              }
            </p>
            
            {poll.poll_options
              .sort((a, b) => a.option_order - b.option_order)
              .map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${option.id}`}
                    checked={selectedOptions.includes(option.id)}
                    onCheckedChange={(checked) => 
                      handleOptionChange(option.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`option-${option.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.option_text}
                  </label>
                </div>
              ))}
            
            <Button
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || voteLoading}
              className="w-full mt-4"
            >
              {voteLoading ? 'Votando...' : 'Confirmar Voto'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}