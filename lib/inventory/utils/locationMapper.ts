/**
 * Unified Location Mapper for NewPennine WMS
 * Centralizes all location mapping logic to eliminate code duplication
 * Previously duplicated in 10+ places across the codebase
 */

export type DatabaseLocationColumn = 
  | 'injection'
  | 'pipeline'
  | 'prebook'
  | 'await'
  | 'fold'
  | 'bulk'
  | 'backcarpark'
  | 'damage'
  | 'await_grn';

export type StandardLocation = 
  | 'PRODUCTION'
  | 'PIPELINE'
  | 'PREBOOK'
  | 'AWAITING'
  | 'FOLD'
  | 'BULK'
  | 'BACK_CARPARK'
  | 'DAMAGE'
  | 'AWAIT_GRN';

export class LocationMapper {
  /**
   * Standard location names to database column names
   */
  private static readonly LOCATION_MAP: Record<StandardLocation, DatabaseLocationColumn> = {
    'PRODUCTION': 'injection',
    'PIPELINE': 'pipeline',
    'PREBOOK': 'prebook',
    'AWAITING': 'await',
    'FOLD': 'fold',
    'BULK': 'bulk',
    'BACK_CARPARK': 'backcarpark',
    'DAMAGE': 'damage',
    'AWAIT_GRN': 'await_grn'
  };

  /**
   * Aliases for location names (case-insensitive)
   * Maps common variations to standard names
   */
  private static readonly ALIASES: Record<string, StandardLocation> = {
    // Production aliases
    'injection': 'PRODUCTION',
    'production': 'PRODUCTION',
    'prod': 'PRODUCTION',
    
    // Pipeline aliases
    'pipeline': 'PIPELINE',
    'pipe': 'PIPELINE',
    'pipe line': 'PIPELINE',
    
    // Prebook aliases
    'prebook': 'PREBOOK',
    'pre book': 'PREBOOK',
    'pre-book': 'PREBOOK',
    
    // Awaiting aliases
    'awaiting': 'AWAITING',
    'await': 'AWAITING',
    'waiting': 'AWAITING',
    
    // Fold aliases
    'fold': 'FOLD',
    'folding': 'FOLD',
    
    // Bulk aliases
    'bulk': 'BULK',
    
    // Back Carpark aliases
    'back carpark': 'BACK_CARPARK',
    'back_carpark': 'BACK_CARPARK',
    'backcarpark': 'BACK_CARPARK',
    'back car park': 'BACK_CARPARK',
    'carpark': 'BACK_CARPARK',
    
    // Damage aliases
    'damage': 'DAMAGE',
    'damaged': 'DAMAGE',
    'dmg': 'DAMAGE',
    
    // Await GRN aliases
    'await grn': 'AWAIT_GRN',
    'await_grn': 'AWAIT_GRN',
    'awaitgrn': 'AWAIT_GRN',
    'awaiting grn': 'AWAIT_GRN'
  };

  /**
   * Convert a location string to its database column name
   * @param location - Location name in any format
   * @returns Database column name or null if not found
   */
  static toDbColumn(location: string): DatabaseLocationColumn | null {
    if (!location) return null;
    
    // Normalize input: lowercase and replace spaces with underscores
    const normalized = location.toLowerCase().trim();
    
    // Check if it's already a database column
    if (Object.values(this.LOCATION_MAP).includes(normalized as DatabaseLocationColumn)) {
      return normalized as DatabaseLocationColumn;
    }
    
    // Check aliases
    const standardLocation = this.ALIASES[normalized];
    if (standardLocation) {
      return this.LOCATION_MAP[standardLocation];
    }
    
    // Check if it's a standard location name (case-insensitive)
    const upperLocation = location.toUpperCase().replace(/\s+/g, '_') as StandardLocation;
    if (upperLocation in this.LOCATION_MAP) {
      return this.LOCATION_MAP[upperLocation];
    }
    
    return null;
  }

  /**
   * Convert a database column name to its standard location name
   * @param column - Database column name
   * @returns Standard location name
   */
  static fromDbColumn(column: DatabaseLocationColumn): StandardLocation {
    const entry = Object.entries(this.LOCATION_MAP).find(([_, col]) => col === column);
    return entry ? entry[0] as StandardLocation : column.toUpperCase() as StandardLocation;
  }

  /**
   * Get all valid standard location names
   * @returns Array of standard location names
   */
  static getAllStandardLocations(): StandardLocation[] {
    return Object.keys(this.LOCATION_MAP) as StandardLocation[];
  }

  /**
   * Get all valid database column names
   * @returns Array of database column names
   */
  static getAllDbColumns(): DatabaseLocationColumn[] {
    return Object.values(this.LOCATION_MAP);
  }

  /**
   * Check if a location string is valid
   * @param location - Location to validate
   * @returns True if valid, false otherwise
   */
  static isValidLocation(location: string): boolean {
    return this.toDbColumn(location) !== null;
  }

  /**
   * Get display name for a location (for UI)
   * @param location - Location in any format
   * @returns Human-readable display name
   */
  static getDisplayName(location: string): string {
    const dbColumn = this.toDbColumn(location);
    if (!dbColumn) return location;
    
    const standardLocation = this.fromDbColumn(dbColumn);
    
    // Convert to human-readable format
    const displayNameMap: Record<StandardLocation, string> = {
      'PRODUCTION': 'Production',
      'PIPELINE': 'Pipeline',
      'PREBOOK': 'Prebook',
      'AWAITING': 'Awaiting',
      'FOLD': 'Fold',
      'BULK': 'Bulk',
      'BACK_CARPARK': 'Back Carpark',
      'DAMAGE': 'Damage',
      'AWAIT_GRN': 'Awaiting GRN'
    };
    
    return displayNameMap[standardLocation] || standardLocation;
  }

  /**
   * Get all location mappings for debugging/documentation
   * @returns Object with all mappings
   */
  static getAllMappings() {
    return {
      standardToDb: this.LOCATION_MAP,
      aliases: this.ALIASES,
      displayNames: this.getAllStandardLocations().map(loc => ({
        standard: loc,
        database: this.LOCATION_MAP[loc],
        display: this.getDisplayName(loc)
      }))
    };
  }
}

// Export convenience functions for common use cases
export const toDbColumn = LocationMapper.toDbColumn.bind(LocationMapper);
export const fromDbColumn = LocationMapper.fromDbColumn.bind(LocationMapper);
export const isValidLocation = LocationMapper.isValidLocation.bind(LocationMapper);
export const getLocationDisplayName = LocationMapper.getDisplayName.bind(LocationMapper);