import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Coins } from 'lucide-react';
import { usePasswordReset } from '@/hooks/usePasswordReset';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { sendResetEmail, loading } = usePasswordReset();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email inválido');
      return;
    }
    
    const result = await sendResetEmail(email);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error?.message || 'Erro ao enviar email de recuperação');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="bg-green-500 text-white rounded-full p-4 shadow-lg">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-primary">Email Enviado!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Instruções de recuperação foram enviadas
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 text-center">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Enviamos um link de recuperação para <strong>{email}</strong>. 
                  Verifique sua caixa de entrada e spam.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                </p>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => setSuccess(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Enviar novamente
                  </Button>
                  
                  <Link to="/login">
                    <Button variant="ghost" className="w-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar ao login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg">
                <Coins className="h-8 w-8" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-primary">Recuperar Senha</CardTitle>
              <CardDescription className="text-base mt-2">
                Digite seu email para receber as instruções
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Informe o email usado no seu cadastro
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar instruções'
                )}
              </Button>
            </form>

            <div className="flex items-center justify-center">
              <Link 
                to="/login"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}