import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Link, X, Loader2, Check } from 'lucide-react';
import { useImageUpload } from '@/hooks/storage/useImageUpload';
import { useImageLoader } from '@/hooks/useImageLoader';

interface ImageSelectorProps {
  value: string;
  onChange: (url: string) => void;
  onPathChange?: (path: string) => void;
  label?: string;
  placeholder?: string;
}

export function ImageSelector({ 
  value, 
  onChange, 
  onPathChange,
  label = "Imagem da carta",
  placeholder = "URL da imagem ou faça upload"
}: ImageSelectorProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState(value || '');
  const [uploadedPath, setUploadedPath] = useState(''); // último caminho confirmado
  const [draftUrl, setDraftUrl] = useState(''); // URL aguardando confirmação
  const [draftPath, setDraftPath] = useState(''); // caminho aguardando confirmação
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage, deleteImage, isUploading } = useImageUpload();
  const previewSrc = draftUrl || value || urlInput;
  const imageLoader = useImageLoader(previewSrc);

  // Log para debug
  console.log('🔍 ImageSelector state:', {
    value,
    urlInput,
    draftUrl,
    previewSrc,
    uploadedPath,
    hasImage: previewSrc !== ''
  });

  useEffect(() => {
    imageLoader.updateSrc(previewSrc);
  }, [previewSrc]);

  const handleUrlChange = (newUrl: string) => {
    setUrlInput(newUrl);
    setDraftUrl(newUrl);
    setDraftPath('');
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file);
    if (result) {
      console.log('✅ Upload bem-sucedido:', result.url);
      
      // Manter a URL localmente para garantir que o preview não desapareça
      setUploadedPath(result.path);
      setUrlInput(result.url);
      
      // Notificar o componente pai (auto-confirmação)
      onChange(result.url);
      onPathChange?.(result.path);
      
      // NÃO limpar draft imediatamente - deixar o useEffect sincronizar
    }
  };

  // Sincronizar estado quando value for atualizado pelo componente pai
  useEffect(() => {
    console.log('🔄 useEffect - Sincronizando:', { value, urlInput, valueEqualsUrlInput: value === urlInput });
    if (value && value === urlInput) {
      // O componente pai atualizou o value com nosso upload
      console.log('✅ Sincronizado - limpando drafts');
      setDraftUrl('');
      setDraftPath('');
    }
  }, [value, urlInput]);

  const handleRemoveImage = async () => {
    // Deletar rascunho enviado
    if (draftPath) {
      await deleteImage(draftPath);
      setDraftPath('');
    }
    // Deletar imagem confirmada
    if (uploadedPath) {
      await deleteImage(uploadedPath);
      setUploadedPath('');
    }
    // Limpar estados e notificar pai
    onChange('');
    onPathChange?.('');
    setDraftUrl('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const confirmImage = async () => {
    const finalUrl = draftUrl.trim();
    if (!finalUrl || imageLoader.isLoading || imageLoader.hasError) return;
    onChange(finalUrl);
    if (draftPath) {
      onPathChange?.(draftPath);
      setUploadedPath(draftPath);
    } else {
      onPathChange?.('');
      setUploadedPath('');
    }
    setDraftUrl('');
    setDraftPath('');
    setUrlInput(finalUrl);
  };

  const cancelDraft = async () => {
    if (draftPath) {
      await deleteImage(draftPath);
    }
    setDraftUrl('');
    setDraftPath('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'url' | 'upload')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4">
          <div>
            <Input
              type="url"
              placeholder={placeholder}
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cole a URL de uma imagem hospedada online
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar arquivo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione uma imagem do seu dispositivo (máx. 5MB)
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview da imagem */}
      {previewSrc && (
        <Card className={draftUrl && draftUrl !== value ? "border-warning" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                Preview
                {draftUrl && draftUrl !== value && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                    Aguardando confirmação
                  </Badge>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                {...imageLoader.getImageProps()}
                alt="Preview"
                className="w-full h-32 object-cover rounded border"
              />
              {imageLoader.isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded border">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 break-all">
              {uploadedPath ? `Arquivo: ${uploadedPath}` : `URL: ${previewSrc}`}
            </p>
            {imageLoader.hasError && (
              <p className="text-xs text-destructive mt-1">
                Erro ao carregar imagem. Usando placeholder.
              </p>
            )}

            {draftUrl && draftUrl !== value && (
              <div className="space-y-2 mt-3">
                <p className="text-sm text-warning font-medium">
                  ⚠️ Você precisa confirmar a imagem antes de salvar a carta
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={confirmImage}
                    disabled={imageLoader.isLoading || imageLoader.hasError}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4" />
                    Confirmar imagem
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelDraft}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}