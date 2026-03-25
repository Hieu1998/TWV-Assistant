import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, '') || '0', 10) : value;
  return new Intl.NumberFormat('vi-VN').format(num) + ' VNĐ';
}
