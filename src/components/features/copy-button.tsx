/**
 * クリップボードコピー機能を持つボタンコンポーネント
 */

'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

type CopyButtonProps = {
  text: string;
  showTooltip?: boolean;
} & Pick<ComponentProps<typeof Button>, 'className'> &
  VariantProps<typeof buttonVariants>;

export function CopyButton({
  text,
  showTooltip = true,
  variant = 'outline',
  size = 'icon',
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <div className='relative'>
      {/* コピー成功メッセージ */}
      {copied && showTooltip && (
        <div className='absolute right-10 top-0 z-20 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-foreground'>
          Copied!
        </div>
      )}

      <Button
        onClick={handleCopy}
        variant={variant}
        size={size}
        className={cn(
          'size-8 rounded-md opacity-70 transition-opacity hover:bg-muted/30 hover:opacity-100',
          className,
        )}
        aria-label='コピー'
      >
        {copied ? (
          <Check className='size-4 text-green-500' />
        ) : (
          <Copy className='size-4 text-muted-foreground' />
        )}
      </Button>
    </div>
  );
}
