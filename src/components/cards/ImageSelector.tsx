import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Link, X, Loader2 } from 'lucide-react';
import { useImageUpload } from '@/hooks/storage/useImageUpload';

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
  const [uploadedPath, setUploadedPath] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadImage, deleteImage, isUploading } = useImageUpload();

  const handleUrlChange = (newUrl: string) => {
    setUrlInput(newUrl);
    onChange(newUrl);
    if (onPathChange) {
      onPathChange(''); // Limpar path quando usar URL
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await uploadImage(file);
    if (result) {
      onChange(result.url);
      setUploadedPath(result.path);
      if (onPathChange) {
        onPathChange(result.path);
      }
      setUrlInput(''); // Limpar URL quando fazer upload
    }
  };

  const handleRemoveImage = async () => {
    if (uploadedPath) {
      const success = await deleteImage(uploadedPath);
      if (success) {
        setUploadedPath('');
        if (onPathChange) {
          onPathChange('');
        }
      }
    }
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      {value && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Preview
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
            <img
              src={value}
              alt="Preview"
              className="w-full h-32 object-cover rounded border"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <p className="text-xs text-muted-foreground mt-2 break-all">
              {uploadedPath ? `Arquivo: ${uploadedPath}` : `URL: ${value}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}