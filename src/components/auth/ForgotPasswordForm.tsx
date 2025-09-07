import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePasswordReset } from '@/hooks/usePasswordReset';
import { Loader2, Mail } from 'lucide-react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { sendResetEmail, loading } = usePasswordReset();
  const { announceToScreenReader } = useAccessibility();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      announceToScreenReader('Por favor, digite seu email');
      return;
    }

    const result = await sendResetEmail(email);
    if (result.success) {
      setIsOpen(false);
      setEmail('');
      announceToScreenReader('Email de recuperação enviado com sucesso');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="link" 
          className="text-sm text-primary hover:underline p-0 h-auto"
          onClick={() => announceToScreenReader('Abrindo formulário de recuperação de senha')}
        >
          Esqueceu a senha?
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md"
        aria-describedby="forgot-password-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recuperar Senha
          </DialogTitle>
        </DialogHeader>
        <div id="forgot-password-description" className="sr-only">
          Formulário para solicitar recuperação de senha por email
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">
              Email cadastrado
            </Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@ifpr.edu.br"
              disabled={loading}
              required
              aria-describedby="reset-email-help"
            />
            <p id="reset-email-help" className="text-sm text-muted-foreground">
              Digite o email usado na sua conta. Enviaremos um link para redefinir sua senha.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                announceToScreenReader('Cancelado');
              }}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !email.trim()}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}