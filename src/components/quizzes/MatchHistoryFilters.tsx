import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

interface MatchHistoryFiltersProps {
  filters: {
    quizId?: string;
    startDate?: string;
    endDate?: string;
    minPlayers?: number;
    maxPlayers?: number;
    result?: 'won' | 'lost' | 'all';
  };
  onFiltersChange: (filters: any) => void;
  quizzes?: any[];
}

export function MatchHistoryFilters({ filters, onFiltersChange, quizzes }: MatchHistoryFiltersProps) {
  const handleClearFilters = () => {
    onFiltersChange({
      quizId: undefined,
      startDate: undefined,
      endDate: undefined,
      minPlayers: undefined,
      maxPlayers: undefined,
      result: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== 'all');

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h3 className="font-semibold">Filtros Avançados</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Quiz</Label>
            <Select
              value={filters.quizId || 'all'}
              onValueChange={(value) => 
                onFiltersChange({ ...filters, quizId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os quizzes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os quizzes</SelectItem>
                {quizzes?.map((quiz) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <Input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Mínimo de Jogadores</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 2"
              value={filters.minPlayers || ''}
              onChange={(e) => onFiltersChange({ ...filters, minPlayers: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label>Máximo de Jogadores</Label>
            <Input
              type="number"
              min="1"
              placeholder="Ex: 10"
              value={filters.maxPlayers || ''}
              onChange={(e) => onFiltersChange({ ...filters, maxPlayers: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label>Resultado</Label>
            <Select
              value={filters.result || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, result: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="won">Vitórias</SelectItem>
                <SelectItem value="lost">Derrotas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
