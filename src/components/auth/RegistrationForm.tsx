import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, Coins, AlertCircle } from 'lucide-react';
import { SuccessMessage } from './SuccessMessage';

export function RegistrationForm() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getUserTypeFromEmail = (email: string) => {
    if (email.endsWith('@estudantes.ifpr.edu.br')) return 'estudante';
    if (email.endsWith('@ifpr.edu.br')) return 'professor';
    if (email === 'paulocauan39@gmail.com') return 'admin';
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido';
    } else if (!getUserTypeFromEmail(form.email)) {
      newErrors.email = 'Domínio de email não permitido';
    }

    if (!form.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (form.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    console.log('Iniciando cadastro...');

    try {
      const userType = getUserTypeFromEmail(form.email);
      const { error } = await signUp(form.email, form.password, form.name);

      if (error) {
        console.error('Erro no cadastro:', error);

        let errorMessage = "Erro ao criar conta";

        if (error.message?.includes('User already registered')) {
          errorMessage = "Este email já está cadastrado. Tente fazer login";
        } else if (error.message?.includes('Invalid email')) {
          errorMessage = "Email inválido";
        } else if (error.message?.includes('Weak password')) {
          errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log('Cadastro realizado com sucesso');
        setSuccess(true);
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Bem-vindo ao IFCoins! Você já pode fazer login.",
        });

        setForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setErrors({});
      }
    } catch (err) {
      console.error('Erro inesperado no cadastro:', err);
      toast({
        title: "Erro no cadastro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (success) {
    return <SuccessMessage onBackToForm={() => setSuccess(false)} />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-accent text-accent-foreground rounded-full p-4">
            <Coins className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-accent">
          Cadastro - IFCoins
        </CardTitle>
        <CardDescription>
          Crie sua conta no sistema IFCoins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="João da Silva"
              disabled={isLoading}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="seu.email@ifpr.edu.br"
              disabled={isLoading}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={isLoading}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="Confirme sua senha"
              disabled={isLoading}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">Tipos de conta:</h4>
            <ul className="space-y-1 text-xs">
              <li><strong>Estudante:</strong> @estudantes.ifpr.edu.br</li>
              <li><strong>Professor:</strong> @ifpr.edu.br</li>
              <li><strong>Admin:</strong> paulocauan39@gmail.com</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              O tipo de conta é definido automaticamente pelo email.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}