'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { uploadApi } from '@/lib/api';
import { uploadToS3, generateS3Key } from '@/utils/s3-upload';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSize?: number; // in bytes
  prefix: string;
  className?: string;
  placeholder?: string;
}

export function FileUpload({
  value,
  onChange,
  accept = "*/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  prefix,
  className,
  placeholder = "Click to upload or drag and drop",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Generate S3 key
      const s3Key = generateS3Key(prefix, file.name);

      // Get presigned URL
      const presignResponse = await uploadApi.getPresignedUrl({
        key: s3Key,
        contentType: file.type,
        maxSize,
      });

      // Upload to S3
      const fileUrl = await uploadToS3(
        file,
        presignResponse.data.data,
        setProgress
      );

      onChange(fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearFile = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = accept.includes('image/') || accept.includes('image/*');

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          uploading ? 'border-primary' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <CardContent className="p-6">
          {value && !uploading ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isImage ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border">
                    <img
                      src={value}
                      alt="Uploaded file"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <File className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">File uploaded</p>
                  <p className="text-xs text-muted-foreground">
                    Click to replace or remove
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFile}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="space-y-2">
                {isImage ? (
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                ) : (
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                )}
                <div className="text-sm">
                  <p className="font-medium">{placeholder}</p>
                  <p className="text-muted-foreground">
                    Max size: {Math.round(maxSize / 1024 / 1024)}MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}