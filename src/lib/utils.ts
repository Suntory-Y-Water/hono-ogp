import { getCloudflareContext } from '@opennextjs/cloudflare';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBaseUrl() {
  const { env } = getCloudflareContext();
  return env.END_POINT || 'http://localhost:3000';
}
