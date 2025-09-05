import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ImageUploadResult {
  url: string;
  path: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File, bucket: string = 'card-images'): Promise<ImageUploadResult | null> => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo selecionado",
        variant: "destructive",
      });
      return null;
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.",
        variant: "destructive",
      });
      return null;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = fileName;

      console.log(`Iniciando upload: ${fileName}`);

      // Fazer upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        toast({
          title: "Erro no upload",
          description: uploadError.message,
          variant: "destructive",
        });
        return null;
      }

      console.log('Upload concluído:', uploadData.path);

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log('URL pública gerada:', publicUrl);

      toast({
        title: "Upload concluído!",
        description: "Imagem enviada com sucesso",
      });

      return {
        url: publicUrl,
        path: filePath,
      };
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado durante o upload",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (path: string, bucket: string = 'card-images'): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Erro ao deletar imagem:', error);
        toast({
          title: "Erro",
          description: "Não foi possível deletar a imagem",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Imagem deletada",
        description: "Imagem removida com sucesso",
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao deletar a imagem",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
  };
}