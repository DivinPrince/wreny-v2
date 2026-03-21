import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const pageSizeMap = {
  a4: {
    width: 210,
    height: 297,
  },
  letter: {
    width: 216,
    height: 279,
  },
} as const

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isUrl(value: string | null | undefined) {
  if (!value) return false
  return /https?:\/\/[^\n ]+/i.test(value)
}

export function isEmptyString(value: string) {
  if (!value || typeof value !== 'string') return true
  return value.trim().length === 0
}

export function hexToRgb(hex: string, alpha = 0) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)

  return alpha ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`
}

export function linearTransform(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  if (inMax === inMin) return value === inMax ? outMin : Number.NaN
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}
