import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateQuiz, CreateQuizData } from '@/hooks/quizzes/useQuizzes';
import { useClasses } from '@/hooks/useClasses';
import { Plus, HelpCircle, Trash2 } from 'lucide-react';
import { useNewCards } from '@/hooks/useNewCards';

const questionSchema = z.object({
  question_text: z.string().min(1, 'Pergunta é obrigatória'),
  question_type: z.enum(['multiple_choice', 'true_false']),
  options: z.array(z.string()).optional(),
  correct_answer: z.string().min(1, 'Resposta correta é obrigatória'),
  points: z.number().min(1, 'Pontuação deve ser maior que 0'),
});

const quizSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  reward_type: z.enum(['coins', 'card']),
  reward_coins: z.number().min(1, 'Recompensa deve ser maior que 0'),
  reward_card_id: z.string().optional(),
  max_attempts: z.number().min(1).optional(),
  time_limit_minutes: z.number().min(1).optional(),
  questions: z.array(questionSchema).min(1, 'Adicione pelo menos uma pergunta'),
});

interface QuizFormProps {
  onSuccess?: () => void;
}

export function QuizForm({ onSuccess }: QuizFormProps) {
  const createQuiz = useCreateQuiz();
  const { data: cards } = useNewCards();
  const { data: classes } = useClasses();
  const [rewardType, setRewardType] = useState<'coins' | 'card'>('coins');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const form = useForm<z.infer<typeof quizSchema>>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      reward_type: 'coins',
      reward_coins: 10,
      reward_card_id: undefined,
      max_attempts: 1,
      time_limit_minutes: undefined,
      questions: [{
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 1,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const addQuestion = () => {
    append({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
  };

  const removeQuestion = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const selectAllClasses = () => {
    if (classes) {
      setSelectedClassIds(classes.map(c => c.id));
    }
  };

  const clearClassSelection = () => {
    setSelectedClassIds([]);
  };

  const onSubmit = (data: z.infer<typeof quizSchema>) => {
    const quizData: CreateQuizData = {
      title: data.title,
      description: data.description,
      reward_type: data.reward_type,
      reward_coins: data.reward_type === 'coins' ? data.reward_coins : 0,
      reward_card_id: data.reward_type === 'card' ? data.reward_card_id : undefined,
      class_ids: selectedClassIds.length > 0 ? selectedClassIds : undefined,
      max_attempts: data.max_attempts,
      time_limit_minutes: data.time_limit_minutes,
      questions: data.questions.map(question => ({
        question_text: question.question_text,
        question_type: question.question_type,
        correct_answer: question.correct_answer,
        points: question.points,
        options: question.question_type === 'multiple_choice' ? 
          question.options?.filter(option => option.trim()) : undefined,
      })),
    };

    createQuiz.mutate(quizData, {
      onSuccess: () => {
        form.reset();
        setSelectedClassIds([]);
        onSuccess?.();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Criar Novo Quiz
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações básicas do quiz */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Título do Quiz</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="Digite o título do quiz"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="reward_type">Tipo de Recompensa</Label>
              <Select
                value={rewardType}
                onValueChange={(value: 'coins' | 'card') => {
                  setRewardType(value);
                  form.setValue('reward_type', value);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coins">Moedas</SelectItem>
                  <SelectItem value="card">Carta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {rewardType === 'coins' ? (
              <div>
                <Label htmlFor="reward_coins">Quantidade de Moedas</Label>
                <Input
                  id="reward_coins"
                  type="number"
                  {...form.register('reward_coins', { valueAsNumber: true })}
                  placeholder="10"
                />
                {form.formState.errors.reward_coins && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.reward_coins.message}</p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="reward_card">Carta Recompensa</Label>
                <Select
                  value={form.watch('reward_card_id')}
                  onValueChange={(value) => form.setValue('reward_card_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma carta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards?.filter(c => c.available).map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.name} ({card.rarity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="max_attempts">Máximo de Tentativas</Label>
              <Input
                id="max_attempts"
                type="number"
                {...form.register('max_attempts', { valueAsNumber: true })}
                placeholder="1"
              />
            </div>

            <div>
              <Label htmlFor="time_limit">Limite de Tempo (minutos)</Label>
              <Input
                id="time_limit"
                type="number"
                {...form.register('time_limit_minutes', { valueAsNumber: true })}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Seleção de Turmas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Turmas (deixe vazio para todas as turmas)</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllClasses}>
                  Selecionar Todas
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearClassSelection}>
                  Limpar
                </Button>
              </div>
            </div>
            
            {classes && classes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${classItem.id}`}
                      checked={selectedClassIds.includes(classItem.id)}
                      onCheckedChange={() => toggleClassSelection(classItem.id)}
                    />
                    <label
                      htmlFor={`class-${classItem.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {classItem.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma turma disponível</p>
            )}
            
            {selectedClassIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedClassIds.length} turma(s) selecionada(s)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Descreva o conteúdo do quiz"
            />
          </div>

          <Separator />

          {/* Perguntas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Perguntas</h3>
              <Button type="button" onClick={addQuestion} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Pergunta
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Pergunta {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Pergunta</Label>
                    <Textarea
                      {...form.register(`questions.${index}.question_text`)}
                      placeholder="Digite a pergunta"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Pergunta</Label>
                      <Select
                        value={form.watch(`questions.${index}.question_type`)}
                        onValueChange={(value) => 
                          form.setValue(`questions.${index}.question_type`, value as any)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                          <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Pontos</Label>
                      <Input
                        type="number"
                        {...form.register(`questions.${index}.points`, { valueAsNumber: true })}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  {form.watch(`questions.${index}.question_type`) === 'multiple_choice' && (
                    <div>
                      <Label>Opções de Resposta</Label>
                      <div className="space-y-2">
                        {[0, 1, 2, 3].map(optionIndex => (
                          <Input
                            key={optionIndex}
                            {...form.register(`questions.${index}.options.${optionIndex}`)}
                            placeholder={`Opção ${String.fromCharCode(65 + optionIndex)}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {form.watch(`questions.${index}.question_type`) === 'true_false' && (
                    <div>
                      <Label>Resposta Correta</Label>
                      <Select
                        value={form.watch(`questions.${index}.correct_answer`)}
                        onValueChange={(value) => 
                          form.setValue(`questions.${index}.correct_answer`, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a resposta correta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Verdadeiro</SelectItem>
                          <SelectItem value="false">Falso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {form.watch(`questions.${index}.question_type`) === 'multiple_choice' && (
                    <div>
                      <Label>Resposta Correta</Label>
                      <Input
                        {...form.register(`questions.${index}.correct_answer`)}
                        placeholder="Digite exatamente como aparece nas opções"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button type="submit" disabled={createQuiz.isPending} className="w-full">
            {createQuiz.isPending ? 'Criando...' : 'Criar Quiz'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}