import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link, Check, X, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NewImageUploadProps {
  onImageSelected: (url: string) => void;
  currentImageUrl?: string;
  className?: string;
}

export function NewImageUpload({ onImageSelected, currentImageUrl, className }: NewImageUploadProps) {
  const [uploadUrl, setUploadUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('📤 NewImageUpload - Current preview URL:', previewUrl);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📤 Starting file upload:', file.name, file.size, file.type);

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "Arquivo muito grande", 
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `cards/${fileName}`;

      console.log('📤 Uploading to path:', filePath);

      const { data, error } = await supabase.storage
        .from('card-images')
        .upload(filePath, file);

      if (error) {
        console.error('❌ Upload error:', error);
        throw error;
      }

      console.log('✅ Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      console.log('📤 Generated public URL:', publicUrl);
      
      setUploadUrl(publicUrl);
      setPreviewUrl(publicUrl);
      
      toast({
        title: "Upload realizado!",
        description: "Imagem enviada com sucesso. Clique em 'Confirmar' para salvar.",
      });
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleExternalUrl = async () => {
    if (!externalUrl.trim()) return;

    setValidating(true);
    try {
      console.log('🔗 Validating external URL:', externalUrl);
      
      // Test if the URL is accessible
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = externalUrl;
      });

      await loadPromise;
      
      setPreviewUrl(externalUrl);
      toast({
        title: "URL validada!",
        description: "URL da imagem está válida. Clique em 'Confirmar' para salvar.",
      });
    } catch (error) {
      console.error('❌ URL validation failed:', error);
      toast({
        title: "URL inválida",
        description: "Não foi possível carregar a imagem desta URL.",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const handleConfirm = () => {
    const finalUrl = uploadUrl || externalUrl || previewUrl;
    if (finalUrl.trim()) {
      console.log('✅ Confirming image URL:', finalUrl);
      onImageSelected(finalUrl);
      toast({
        title: "Imagem confirmada!",
        description: "A imagem foi definida para esta carta.",
      });
    }
  };

  const handleRemove = () => {
    setUploadUrl('');
    setExternalUrl('');
    setPreviewUrl('');
    onImageSelected('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida desta carta.",
    });
  };

  const hasChanges = uploadUrl || externalUrl || (previewUrl !== currentImageUrl);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">Imagem da Carta</CardTitle>
        <CardDescription className="text-xs">
          Faça upload ou use uma URL externa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        {previewUrl && (
          <div className="relative">
            <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={() => {
                  console.error('❌ Preview image failed to load:', previewUrl);
                }}
              />
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-sm">Upload de arquivo</Label>
          <Input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </div>

        {/* External URL */}
        <div className="space-y-2">
          <Label htmlFor="external-url" className="text-sm">URL externa</Label>
          <div className="flex gap-2">
            <Input
              id="external-url"
              type="url"
              placeholder="https://exemplo.com/imagem.jpg"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={validating}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleExternalUrl}
              disabled={!externalUrl.trim() || validating}
            >
              {validating ? <Eye className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleConfirm}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirmar Imagem
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRemove}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}

        {uploading && (
          <div className="text-center text-sm text-muted-foreground">
            Enviando imagem...
          </div>
        )}
      </CardContent>
    </Card>
  );
}