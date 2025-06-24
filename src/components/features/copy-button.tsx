/**
 * クリップボードコピー機能を持つボタンコンポーネント
 */

'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

type CopyButtonProps = {
  text: string;
  children: React.ReactNode;
  successText?: string;
} & Pick<ComponentProps<typeof Button>, 'className'> &
  VariantProps<typeof buttonVariants>;

export function CopyButton({
  text,
  children,
  successText = 'コピー済み',
  variant = 'outline',
  size,
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      className={className}
    >
      {copied ? successText : children}
    </Button>
  );
}
