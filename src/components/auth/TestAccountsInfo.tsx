
import React from 'react';

export function TestAccountsInfo() {
  return (
    <div className="mt-6 p-4 bg-muted rounded-lg">
      <div className="text-sm text-muted-foreground space-y-2">
        <h4 className="font-medium text-foreground">Contas de Teste:</h4>
        <ul className="space-y-1">
          <li><strong>Admin:</strong> paulocauan39@gmail.com</li>
          <li><strong>Professor:</strong> professor@ifpr.edu.br</li>
          <li><strong>Estudante:</strong> estudante@estudantes.ifpr.edu.br</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-2">
          Senha: qualquer (para testes). O tipo de conta é definido automaticamente pelo email.
        </p>
      </div>
    </div>
  );
}
