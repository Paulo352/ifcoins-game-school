import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/hooks/useClasses';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CSVImport() {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  const { data: classes } = useClasses();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const csv = 'nome,email,ra\nJoão Silva,joao@exemplo.com,12345\nMaria Santos,maria@exemplo.com,12346';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_alunos.csv';
    a.click();
  };

  const handleImport = async () => {
    if (!file || !selectedClassId) {
      toast.error('Selecione uma turma e um arquivo CSV');
      return;
    }

    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo vazio ou inválido');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = headers.indexOf('nome');
      const emailIndex = headers.indexOf('email');
      const raIndex = headers.indexOf('ra');

      if (nameIndex === -1 || emailIndex === -1) {
        throw new Error('CSV deve conter as colunas: nome, email');
      }

      const students = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return {
          name: values[nameIndex],
          email: values[emailIndex],
          ra: raIndex !== -1 ? values[raIndex] : undefined,
        };
      });

      const { data: { user: admin } } = await supabase.auth.getUser();
      if (!admin) throw new Error('Não autenticado');

      let successCount = 0;
      let errorCount = 0;

      for (const student of students) {
        try {
          // Criar usuário no auth (senha padrão temporária)
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: student.email,
            password: 'senha123', // Senha temporária
            email_confirm: true,
          });

          if (authError) {
            console.error('Erro ao criar usuário:', student.email, authError);
            errorCount++;
            continue;
          }

          // Criar perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              name: student.name,
              email: student.email,
              ra: student.ra,
              role: 'student',
            });

          if (profileError) {
            console.error('Erro ao criar perfil:', student.email, profileError);
            errorCount++;
            continue;
          }

          // Adicionar à turma
          const { error: classError } = await supabase
            .from('class_students')
            .insert({
              class_id: selectedClassId,
              student_id: authData.user.id,
              added_by: admin.id,
            });

          if (classError) {
            console.error('Erro ao adicionar à turma:', student.email, classError);
            errorCount++;
            continue;
          }

          successCount++;
        } catch (err) {
          console.error('Erro ao processar aluno:', student.email, err);
          errorCount++;
        }
      }

      toast.success(`Importação concluída: ${successCount} alunos adicionados`);
      if (errorCount > 0) {
        toast.warning(`${errorCount} alunos não puderam ser importados`);
      }
      
      setFile(null);
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao importar CSV');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Alunos via CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O arquivo CSV deve conter as colunas: <strong>nome</strong>, <strong>email</strong> e opcionalmente <strong>ra</strong>.
            Os alunos receberão a senha padrão <strong>senha123</strong> que deve ser alterada no primeiro acesso.
          </AlertDescription>
        </Alert>

        <Button onClick={downloadTemplate} variant="outline" className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Baixar Template CSV
        </Button>

        <div>
          <Label>Turma de Destino</Label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a turma" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="csv-file">Arquivo CSV</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        <Button 
          onClick={handleImport} 
          disabled={!file || !selectedClassId || importing}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {importing ? 'Importando...' : 'Importar Alunos'}
        </Button>
      </CardContent>
    </Card>
  );
}
