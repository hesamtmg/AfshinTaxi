// utils/currency.ts
// Iran Toman formatter
// 1 Toman = 10 Rial (we store/display in Toman)

/**
 * Format a number as Iranian Toman
 * e.g. 150000 → "۱۵۰,۰۰۰ تومان"
 * e.g. 150000 → "150,000 تومان" (latin digits)
 */
export const formatToman = (amount: number | string | null | undefined, usePersianDigits = false): string => {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'

  // Round to whole Toman (no decimals for Toman)
  const rounded = Math.round(num)

  // Format with thousand separators
  const formatted = rounded.toLocaleString('en-US')

  if (usePersianDigits) {
    const persian = formatted.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)])
    return `${persian} تومان`
  }

  return `${formatted} تومان`
}

/**
 * Compact format for large numbers
 * e.g. 1500000 → "۱.۵ میلیون تومان"
 */
export const formatTomanCompact = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} میلیون تومان`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)} هزار تومان`
  }
  return formatToman(num)
}
