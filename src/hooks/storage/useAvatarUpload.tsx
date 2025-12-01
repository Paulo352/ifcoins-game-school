import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AvatarUploadResult {
  url: string;
  path: string;
}

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File, userId: string): Promise<AvatarUploadResult | null> => {
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
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      console.log(`Iniciando upload do avatar: ${fileName}`);

      // Fazer upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
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
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('URL pública gerada:', publicUrl);

      // Atualizar avatar_url no perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o perfil com o novo avatar",
          variant: "destructive",
        });
        return null;
      }

      toast({
        title: "Avatar atualizado!",
        description: "Foto de perfil enviada com sucesso",
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

  const deleteAvatar = async (userId: string, avatarPath?: string): Promise<boolean> => {
    try {
      // Se tiver path, deletar o arquivo
      if (avatarPath) {
        // Extrair path do storage da URL
        const pathMatch = avatarPath.match(/avatars\/(.+)$/);
        const storagePath = pathMatch ? pathMatch[1] : avatarPath;
        
        const { error } = await supabase.storage
          .from('avatars')
          .remove([storagePath]);

        if (error) {
          console.error('Erro ao deletar avatar:', error);
          // Continuar mesmo se houver erro ao deletar o arquivo
        }
      }

      // Remover avatar_url do perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar perfil:', updateError);
        toast({
          title: "Erro",
          description: "Não foi possível remover o avatar do perfil",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Avatar removido",
        description: "Foto de perfil removida com sucesso",
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar avatar:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao remover avatar",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadAvatar,
    deleteAvatar,
    isUploading,
  };
}
