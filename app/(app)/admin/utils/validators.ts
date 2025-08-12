/**
 * Validators utility functions
 * Common validation functions used across admin cards
 */

/**
 * Validate clock number format
 * @param clockNumber - Clock number to validate
 * @returns True if valid, false otherwise
 */
export const validateClockNumber = (clockNumber: string): boolean => {
  // Clock number should be numeric and 4-6 digits
  const clockNumberRegex = /^\d{4,6}$/;
  return clockNumberRegex.test(clockNumber);
};

/**
 * Validate transfer destination based on current location
 * @param currentLocation - Current location of the pallet
 * @param destination - Destination location
 * @param allowedDestinations - Map of allowed destinations per location
 * @returns True if valid transfer, false otherwise
 */
export const validateTransferDestination = (
  currentLocation: string,
  destination: string,
  allowedDestinations: Record<string, string[]>
): boolean => {
  if (!currentLocation || !destination) return false;
  if (currentLocation === destination) return false;
  
  const allowed = allowedDestinations[currentLocation];
  if (!allowed) return false;
  
  return allowed.includes(destination);
};

/**
 * Validate pallet ID format
 * @param palletId - Pallet ID to validate
 * @returns True if valid, false otherwise
 */
export const validatePalletId = (palletId: string): boolean => {
  if (!palletId || palletId.trim() === '') return false;
  
  // Check for different pallet ID formats
  // Format 1: Simple numeric ID (e.g., "12345")
  const numericFormat = /^\d+$/;
  // Format 2: QR Code/Series format (e.g., "ABC-123-456")
  const qrFormat = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/i;
  // Format 3: Alphanumeric format (e.g., "PLT123456")
  const alphanumericFormat = /^[A-Z0-9]+$/i;
  
  return numericFormat.test(palletId) || 
         qrFormat.test(palletId) || 
         alphanumericFormat.test(palletId);
};