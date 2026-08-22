import { clsx, type ClassValue } from 'clsx'
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getLocalDateString(date: Date = new Date()) {
  return format(date, 'yyyy-MM-dd')
}
