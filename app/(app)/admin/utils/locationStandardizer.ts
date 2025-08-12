/**
 * Location Standardizer Utility
 * Handles location name standardization for consistent UI/database mapping
 */

import { LOCATION_DESTINATIONS } from '../constants/stockTransfer';

export class LocationStandardizer {
  /**
   * Standardize location names for UI consistency
   * Converts database location formats to UI-expected formats
   */
  static standardizeForUI(location: string): string {
    if (!location) return 'Await';
    
    const normalized = location.toLowerCase().trim();
    
    // Location standardization mapping
    const standardMap: Record<string, string> = {
      'await': 'Await',
      'await_grn': 'Await_grn', 
      'fold mill': 'Fold Mill',
      'foldmill': 'Fold Mill',
      'pipeline': 'PipeLine',
      'pipe line': 'PipeLine',
      'production': 'Production',
      'damage': 'Damage',
      'voided': 'Voided',
      'void': 'Voided',
      'lost': 'Lost',
      'ship': 'Ship',
    };
    
    return standardMap[normalized] || location;
  }
  
  /**
   * Get valid destinations for a given current location
   * Uses standardized location names for consistent mapping
   */
  static getValidDestinations(currentLocation: string): string[] {
    const standardizedLocation = this.standardizeForUI(currentLocation);
    return LOCATION_DESTINATIONS[standardizedLocation] || [];
  }
  
  /**
   * Check if a location has valid transfer destinations
   */
  static hasValidDestinations(currentLocation: string): boolean {
    return this.getValidDestinations(currentLocation).length > 0;
  }
  
  /**
   * Get location info for debugging
   */
  static getLocationDebugInfo(location: string) {
    const standardized = this.standardizeForUI(location);
    const destinations = this.getValidDestinations(location);
    
    return {
      original: location,
      standardized,
      destinations,
      hasDestinations: destinations.length > 0,
    };
  }
}