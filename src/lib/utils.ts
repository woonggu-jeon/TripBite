import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn/ui 호환 className 헬퍼.
 * SCSS Modules와 병행 사용 가능.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
