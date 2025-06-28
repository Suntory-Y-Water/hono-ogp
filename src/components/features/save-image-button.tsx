/**
 * 画像保存機能を持つボタンコンポーネント
 */

'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

type SaveImageButtonProps = {
  imageUrl: string;
  filename: string;
  children: React.ReactNode;
} & Pick<ComponentProps<typeof Button>, 'className'> &
  VariantProps<typeof buttonVariants>;

export function SaveImageButton({
  imageUrl,
  filename,
  children,
  variant = 'outline',
  size,
  className,
}: SaveImageButtonProps) {
  const handleSaveImage = async () => {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleSaveImage}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
}
