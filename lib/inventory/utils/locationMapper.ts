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
    PRODUCTION: 'injection',
    PIPELINE: 'pipeline',
    PREBOOK: 'prebook',
    AWAITING: 'await',
    FOLD: 'fold',
    BULK: 'bulk',
    BACK_CARPARK: 'backcarpark',
    DAMAGE: 'damage',
    AWAIT_GRN: 'await_grn',
  };

  /**
   * Type guard to check if a string is a valid DatabaseLocationColumn
   */
  private static isDatabaseLocationColumn(value: string): value is DatabaseLocationColumn {
    return Object.values(this.LOCATION_MAP).includes(value as DatabaseLocationColumn);
  }

  /**
   * Type guard to check if a string is a valid StandardLocation
   */
  private static isStandardLocation(value: string): value is StandardLocation {
    return Object.keys(this.LOCATION_MAP).includes(value);
  }

  /**
   * Aliases for location names (case-insensitive)
   * Maps common variations to standard names
   */
  private static readonly ALIASES: Record<string, StandardLocation> = {
    // Production aliases
    injection: 'PRODUCTION',
    production: 'PRODUCTION',
    prod: 'PRODUCTION',

    // Pipeline aliases
    pipeline: 'PIPELINE',
    pipe: 'PIPELINE',
    'pipe line': 'PIPELINE',

    // Prebook aliases
    prebook: 'PREBOOK',
    'pre book': 'PREBOOK',
    'pre-book': 'PREBOOK',

    // Awaiting aliases
    awaiting: 'AWAITING',
    await: 'AWAITING',
    waiting: 'AWAITING',

    // Fold aliases
    fold: 'FOLD',
    folding: 'FOLD',

    // Bulk aliases
    bulk: 'BULK',

    // Back Carpark aliases
    'back carpark': 'BACK_CARPARK',
    back_carpark: 'BACK_CARPARK',
    backcarpark: 'BACK_CARPARK',
    'back car park': 'BACK_CARPARK',
    carpark: 'BACK_CARPARK',

    // Damage aliases
    damage: 'DAMAGE',
    damaged: 'DAMAGE',
    dmg: 'DAMAGE',

    // Await GRN aliases
    'await grn': 'AWAIT_GRN',
    await_grn: 'AWAIT_GRN',
    awaitgrn: 'AWAIT_GRN',
    'awaiting grn': 'AWAIT_GRN',
  };

  /**
   * Convert a location string to its database column name
   * @param location - Location name in any format
   * @returns Database column name or null if not found
   */
  static toDbColumn(location: string): DatabaseLocationColumn | null {
    if (!location?.trim()) return null;

    // Normalize input: lowercase and trim
    const normalized = location.toLowerCase().trim();

    // Check if it's already a database column
    if (this.isDatabaseLocationColumn(normalized)) {
      return normalized;
    }

    // Check aliases
    const standardLocation = this.ALIASES[normalized];
    if (standardLocation) {
      return this.LOCATION_MAP[standardLocation];
    }

    // Check if it's a standard location name (case-insensitive)
    const upperLocation = location.toUpperCase().replace(/\s+/g, '_');
    if (this.isStandardLocation(upperLocation)) {
      return this.LOCATION_MAP[upperLocation as StandardLocation];
    }

    return null;
  }

  /**
   * Convert a database column name to its standard location name
   * @param column - Database column name
   * @returns Standard location name or throws error if not found
   */
  static fromDbColumn(column: DatabaseLocationColumn): StandardLocation {
    const entry = Object.entries(this.LOCATION_MAP).find(([_, col]) => col === column);
    if (entry) {
      return entry[0] as StandardLocation;
    }

    // Fallback: attempt to map by converting to uppercase
    const upperColumn = column.toUpperCase();
    if (this.isStandardLocation(upperColumn)) {
      return upperColumn as StandardLocation;
    }

    throw new Error(`Invalid database column: ${column}`);
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
   * Get all valid database column names (alias for getAllDbColumns)
   * @returns Array of database column names
   */
  static getValidDatabaseLocations(): DatabaseLocationColumn[] {
    return this.getAllDbColumns();
  }

  /**
   * Get valid database locations for instance method access
   * @returns Array of database column names
   */
  getValidDatabaseLocations(): DatabaseLocationColumn[] {
    return LocationMapper.getValidDatabaseLocations();
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
   * Convert a location string to StandardLocation enum value
   * @param location - Location string
   * @returns StandardLocation or null if invalid
   */
  static toStandardLocation(location: string): StandardLocation | null {
    if (!location?.trim()) return null;

    // Normalize input: lowercase and trim
    const normalized = location.toLowerCase().trim();

    // Check aliases first
    const standardLocation = this.ALIASES[normalized];
    if (standardLocation) {
      return standardLocation;
    }

    // Check if it's already a standard location name (case-insensitive)
    const upperLocation = location.toUpperCase().replace(/\s+/g, '_');
    if (this.isStandardLocation(upperLocation)) {
      return upperLocation as StandardLocation;
    }

    // Check if it's a database column, then reverse map
    if (this.isDatabaseLocationColumn(normalized)) {
      for (const [std, db] of Object.entries(this.LOCATION_MAP)) {
        if (db === normalized) {
          return std as StandardLocation;
        }
      }
    }

    return null;
  }

  /**
   * Get display name for a location (for UI)
   * @param location - Location in any format
   * @returns Human-readable display name
   */
  static getDisplayName(location: string): string {
    if (!location?.trim()) return '';

    const dbColumn = this.toDbColumn(location);
    if (!dbColumn) return location;

    try {
      const standardLocation = this.fromDbColumn(dbColumn);

      // Convert to human-readable format
      const displayNameMap: Record<StandardLocation, string> = {
        PRODUCTION: 'Production',
        PIPELINE: 'Pipeline',
        PREBOOK: 'Prebook',
        AWAITING: 'Awaiting',
        FOLD: 'Fold',
        BULK: 'Bulk',
        BACK_CARPARK: 'Back Carpark',
        DAMAGE: 'Damage',
        AWAIT_GRN: 'Awaiting GRN',
      };

      return displayNameMap[standardLocation] || standardLocation;
    } catch {
      return location;
    }
  }

  /**
   * Get all location mappings for debugging/documentation
   * @returns Object with all mappings
   */
  static getAllMappings(): {
    standardToDb: Record<StandardLocation, DatabaseLocationColumn>;
    aliases: Record<string, StandardLocation>;
    displayNames: Array<{
      standard: StandardLocation;
      database: DatabaseLocationColumn;
      display: string;
    }>;
  } {
    return {
      standardToDb: this.LOCATION_MAP,
      aliases: this.ALIASES,
      displayNames: this.getAllStandardLocations().map(loc => ({
        standard: loc,
        database: this.LOCATION_MAP[loc],
        display: this.getDisplayName(loc),
      })),
    };
  }
}

// Export convenience functions for common use cases
export const toDbColumn = LocationMapper.toDbColumn.bind(LocationMapper);
export const fromDbColumn = LocationMapper.fromDbColumn.bind(LocationMapper);
export const isValidLocation = LocationMapper.isValidLocation.bind(LocationMapper);
export const getLocationDisplayName = LocationMapper.getDisplayName.bind(LocationMapper);
