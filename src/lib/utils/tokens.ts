import { supabase } from '../supabase';

/**
 * Generate a random token of specified length
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(array[i] % chars.length);
  }
  return token;
}

/**
 * Generate a unique shortcode in format VSP-XXX (6 random alphanumeric chars)
 */
export function generateShortcode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(array[i] % chars.length);
  }
  return `VSP-${code}`;
}

/**
 * Generate a unique shortcode that doesn't exist in the database
 */
export async function getUniqueShortcode(): Promise<string> {
  let shortcode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    shortcode = generateShortcode();
    const { data } = await supabase
      .from('cars')
      .select('shortcode')
      .eq('shortcode', shortcode)
      .single();
    
    if (!data) {
      return shortcode;
    }
    attempts++;
  } while (attempts < maxAttempts);

  // Fallback: use cryptographically random code if we can't find a unique one
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  let fallback = '';
  for (let i = 0; i < 8; i++) {
    fallback += chars.charAt(array[i] % chars.length);
  }
  return `VSP-${fallback}`;
}