/**
 * Generate a cryptographically secure random URL token
 */
export function generateSecureToken(length = 24): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  
  let token = '';
  for (let i = 0; i < length; i++) {
    token += charset[array[i] % charset.length];
  }
  return token;
}
