/**
 * Phone number utilities for the Pakistan market.
 *
 * Pakistani numbers follow E.164 format: +92XXXXXXXXXX (12 digits total).
 * Agents often enter numbers as 03XXXXXXXXX (11 digits) or 923XXXXXXXXX.
 *
 * All customer records store the normalised form (without the + prefix) so
 * that search is reliable regardless of how the number was entered.
 */

/**
 * Normalises a raw phone input to the storage format "92XXXXXXXXXX".
 *
 * Rules:
 *  - Strips all non-digit characters (spaces, dashes, parentheses, +)
 *  - Converts leading 0 (local Pakistani format) → 92 prefix
 *  - Passes through numbers already starting with 92
 *
 * @param raw - User-entered phone string (any format)
 * @returns Normalised string like "923211234567", or the stripped digits if
 *          the format is unrecognised.
 *
 * @example
 *   normalisePhone("0321-123-4567")   → "923211234567"
 *   normalisePhone("+923211234567")   → "923211234567"
 *   normalisePhone("923211234567")    → "923211234567"
 */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // Local format: 03XXXXXXXXX (11 digits starting with 0)
  if (digits.startsWith('0') && digits.length === 11) {
    return '92' + digits.slice(1);
  }

  // Already in storage format or international format without +
  if (digits.startsWith('92') && digits.length === 12) {
    return digits;
  }

  // Return as-is if unrecognised — let backend validation catch it
  return digits;
}

/**
 * Formats a stored phone number for display (e.g. "0321 1234567").
 *
 * @param stored - Normalised phone like "923211234567"
 * @returns Display string like "0321 1234567"
 */
export function displayPhone(stored: string): string {
  if (stored.startsWith('92') && stored.length === 12) {
    const local = '0' + stored.slice(2);
    return `${local.slice(0, 4)} ${local.slice(4)}`;
  }
  return stored;
}

/**
 * Returns true if the input, after normalisation, looks like a valid Pakistani
 * mobile number (12 digits, starting with 92).
 */
export function isValidPhone(raw: string): boolean {
  const normalised = normalisePhone(raw);
  return /^92[3][0-9]{9}$/.test(normalised);
}
