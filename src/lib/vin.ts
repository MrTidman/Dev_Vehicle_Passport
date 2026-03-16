/**
 * VIN (Vehicle Identification Number) utilities
 */

/**
 * Mask a VIN to show only the last 6 characters
 * @param vin - Full 17-character VIN
 * @returns Masked VIN (e.g., "*****ABC123")
 */
export function maskVIN(vin: string): string {
  if (!vin || vin.length < 6) return vin;
  
  // Ensure VIN is uppercase and remove spaces
  const cleanVIN = vin.toUpperCase().replace(/\s/g, '');
  
  // Show only last 6 characters
  const lastSix = cleanVIN.slice(-6);
  const masked = '*'.repeat(Math.max(0, cleanVIN.length - 6));
  
  return masked + lastSix;
}

/**
 * Validate a VIN (basic validation - 17 characters, alphanumeric)
 * @param vin - VIN to validate
 * @returns True if valid format
 */
export function isValidVIN(vin: string): boolean {
  if (!vin || vin.length !== 17) return false;
  
  // VINs don't contain I, O, or Q
  const validPattern = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return validPattern.test(vin);
}