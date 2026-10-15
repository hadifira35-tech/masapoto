/**
 * Format Indonesian telephone number for WhatsApp wa.me links
 * e.g., 0895406181407 -> 62895406181407
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Strip all non-numeric characters
  let digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  } else if (!digits.startsWith('62') && digits.length >= 8) {
    digits = '62' + digits;
  }

  return digits;
}

export function isValidWhatsAppNumber(phone: string): boolean {
  const sanitized = sanitizeWhatsAppNumber(phone);
  // Valid Indonesian mobile numbers usually 10-14 digits starting with 628
  return sanitized.startsWith('628') && sanitized.length >= 10 && sanitized.length <= 15;
}

/**
 * Generate click-to-chat URL for WhatsApp
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const sanitizedPhone = sanitizeWhatsAppNumber(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${sanitizedPhone}?text=${encodedText}`;
}

/**
 * Replace placeholders in template text with actual client & form values
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Matches [KEY], {{key}}, {key}
    const regex = new RegExp(`\\[${key}\\]|\\{\\{${key}\\}\\}|\\{${key}\\}`, 'gi');
    result = result.replace(regex, value ?? '');
  }
  return result;
}
