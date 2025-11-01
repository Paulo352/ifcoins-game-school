import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Clock, Users, ChevronDown, ChevronUp, Trash2, XCircle } from 'lucide-react';
import { PollWithOptions, PollVote } from '@/hooks/usePolls';
import { usePollResults } from '@/hooks/usePolls';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewPollCardProps {
  poll: PollWithOptions;
  userVotes: PollVote[];
  onVote: (pollId: string, optionIds: string[]) => void;
  onDeactivate?: (pollId: string) => void;
  onDelete?: (pollId: string) => void;
  showResults?: boolean;
  voteLoading?: boolean;
}

export function NewPollCard({
  poll,
  userVotes,
  onVote,
  onDeactivate,
  onDelete,
  showResults = false,
  voteLoading = false
}: NewPollCardProps) {
  const { profile } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showResultsState, setShowResultsState] = useState(false);
  const { data: results } = usePollResults(poll.id);

  const isAdmin = profile?.role === 'admin';
  const isExpired = new Date(poll.end_date) < new Date();
  const hasUserVoted = userVotes.some(vote => vote.poll_id === poll.id);
  const shouldShowResults = showResults || hasUserVoted || isExpired || !poll.is_active;

  // Calcular resultados
  const totalVotes = results?.reduce((sum, r) => sum + r.vote_count, 0) || 0;
  const resultsByOption = new Map(results?.map(r => [r.option_id, r]) || []);

  useEffect(() => {
    if (hasUserVoted) {
      const votedOptions = userVotes
        .filter(vote => vote.poll_id === poll.id)
        .map(vote => vote.option_id);
      setSelectedOptions(votedOptions);
    }
  }, [userVotes, poll.id, hasUserVoted]);

  const handleOptionSelect = (optionId: string) => {
    if (poll.allow_multiple_votes) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote(poll.id, selectedOptions);
    }
  };

  const getOptionPercentage = (optionId: string) => {
    if (totalVotes === 0) return 0;
    const result = resultsByOption.get(optionId);
    return result ? Math.round((result.vote_count / totalVotes) * 100) : 0;
  };

  const getOptionVotes = (optionId: string) => {
    const result = resultsByOption.get(optionId);
    return result?.vote_count || 0;
  };

  // Determinar se as opções têm imagens
  const hasImages = poll.poll_options.some(opt => opt.image_url);

  return (
    <Card className="overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 bg-card/80 backdrop-blur">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-2xl leading-tight">{poll.title}</CardTitle>
            {poll.description && (
              <CardDescription className="text-base">{poll.description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {!poll.is_active && (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Encerrada
              </Badge>
            )}
            {isExpired && poll.is_active && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                Expirada
              </Badge>
            )}
            {!isExpired && poll.is_active && (
              <Badge variant="default" className="gap-1">
                ✨ Ativa
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>
              Termina em {format(new Date(poll.end_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}</span>
          </div>
        </div>

        {poll.allow_multiple_votes && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Você pode escolher múltiplas opções</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {shouldShowResults ? (
          // Mostrar resultados
          <div className="space-y-3">
            {poll.poll_options
              .sort((a, b) => a.option_order - b.option_order)
              .map((option) => {
                const percentage = getOptionPercentage(option.id);
                const votes = getOptionVotes(option.id);
                const isUserVoted = selectedOptions.includes(option.id);

                return (
                  <div
                    key={option.id}
                    className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                      isUserVoted
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    {/* Barra de progresso */}
                    <div
                      className="absolute inset-0 bg-primary/10 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative p-4">
                      <div className="flex items-center gap-4">
                        {/* Imagem da opção */}
                        {option.image_url && (
                          <div className="flex-shrink-0">
                            <img
                              src={option.image_url}
                              alt={option.option_text}
                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border-2 border-border"
                            />
                          </div>
                        )}

                        {/* Texto e estatísticas */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-base truncate">
                              {option.option_text}
                              {isUserVoted && (
                                <Badge variant="default" className="ml-2">
                                  Seu voto
                                </Badge>
                              )}
                            </span>
                            <span className="font-bold text-lg text-primary whitespace-nowrap">
                              {percentage}%
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {votes} {votes === 1 ? 'voto' : 'votos'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          // Mostrar opções de votação
          <div className="space-y-3">
            {poll.allow_multiple_votes ? (
              // Checkboxes para múltiplos votos
              <div className="space-y-3">
                {poll.poll_options
                  .sort((a, b) => a.option_order - b.option_order)
                  .map((option) => (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedOptions.includes(option.id)
                          ? 'border-2 border-primary bg-primary/5'
                          : 'border-2'
                      }`}
                      onClick={() => handleOptionSelect(option.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            id={option.id}
                            checked={selectedOptions.includes(option.id)}
                            onCheckedChange={() => handleOptionSelect(option.id)}
                          />
                          {option.image_url && (
                            <img
                              src={option.image_url}
                              alt={option.option_text}
                              className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border-2 border-border"
                            />
                          )}
                          <Label
                            htmlFor={option.id}
                            className="flex-1 text-base font-medium cursor-pointer"
                          >
                            {option.option_text}
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              // Radio buttons para voto único
              <RadioGroup value={selectedOptions[0] || ''} onValueChange={(value) => handleOptionSelect(value)}>
                <div className="space-y-3">
                  {poll.poll_options
                    .sort((a, b) => a.option_order - b.option_order)
                    .map((option) => (
                      <Card
                        key={option.id}
                        className={`cursor-pointer transition-all hover:border-primary/50 ${
                          selectedOptions.includes(option.id)
                            ? 'border-2 border-primary bg-primary/5'
                            : 'border-2'
                        }`}
                        onClick={() => handleOptionSelect(option.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <RadioGroupItem value={option.id} id={option.id} />
                            {option.image_url && (
                              <img
                                src={option.image_url}
                                alt={option.option_text}
                                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border-2 border-border"
                              />
                            )}
                            <Label
                              htmlFor={option.id}
                              className="flex-1 text-base font-medium cursor-pointer"
                            >
                              {option.option_text}
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </RadioGroup>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-4 border-t">
        {!shouldShowResults && (
          <Button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || voteLoading}
            className="flex-1 h-10 font-semibold"
          >
            {voteLoading ? '⏳ Votando...' : '✅ Confirmar Voto'}
          </Button>
        )}

        {shouldShowResults && !showResultsState && (
          <Button
            variant="outline"
            onClick={() => setShowResultsState(true)}
            className="flex-1"
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
        )}

        {isAdmin && (
          <>
            {poll.is_active && onDeactivate && (
              <Button
                variant="outline"
                onClick={() => onDeactivate(poll.id)}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Desativar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => onDelete(poll.id)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Deletar
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
}
