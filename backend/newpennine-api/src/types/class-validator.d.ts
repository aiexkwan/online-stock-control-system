declare module 'class-validator' {
  // Re-export all the decorators that are commonly used
  export function IsString(validationOptions?: any): PropertyDecorator;
  export function IsNotEmpty(validationOptions?: any): PropertyDecorator;
  export function IsOptional(validationOptions?: any): PropertyDecorator;
  export function IsInt(validationOptions?: any): PropertyDecorator;
  export function Min(min: number, validationOptions?: any): PropertyDecorator;
  export function Max(max: number, validationOptions?: any): PropertyDecorator;
  export function IsArray(validationOptions?: any): PropertyDecorator;
  export function IsDateString(validationOptions?: any): PropertyDecorator;
  export function IsIn(
    values: Record<string, unknown>[],
    validationOptions?: any,
  ): PropertyDecorator;
  export function IsEmail(
    options?: any,
    validationOptions?: any,
  ): PropertyDecorator;
  export function MinLength(
    length: number,
    validationOptions?: any,
  ): PropertyDecorator;
  export function IsEnum(entity: any, options?: any): PropertyDecorator;
  export function IsNumberString(options?: any): PropertyDecorator;
  export function Matches(
    pattern: string | RegExp,
    validationOptions?: any,
  ): PropertyDecorator;
  export function IsBoolean(options?: any): PropertyDecorator;
  export function IsNumber(options?: any): PropertyDecorator;
  export function IsObject(options?: any): PropertyDecorator;
  export function IsDate(options?: any): PropertyDecorator;
  export function IsDefined(options?: any): PropertyDecorator;
  export function ArrayMinSize(min: number, options?: any): PropertyDecorator;
  export function ArrayMaxSize(max: number, options?: any): PropertyDecorator;
  export function ArrayUnique(options?: any): PropertyDecorator;
  export function ArrayNotEmpty(options?: any): PropertyDecorator;
  export function IsUUID(version?: any, options?: any): PropertyDecorator;
  export function IsUrl(options?: any): PropertyDecorator;
  export function IsJSON(options?: any): PropertyDecorator;
  export function IsIP(version?: any, options?: any): PropertyDecorator;
  export function IsPort(options?: any): PropertyDecorator;
  export function IsAlpha(locale?: any, options?: any): PropertyDecorator;
  export function IsAlphanumeric(
    locale?: any,
    options?: any,
  ): PropertyDecorator;
  export function IsAscii(options?: any): PropertyDecorator;
  export function IsBase64(options?: any): PropertyDecorator;
  export function IsByteLength(
    min: number,
    max?: number,
    options?: any,
  ): PropertyDecorator;
  export function IsCreditCard(options?: any): PropertyDecorator;
  export function IsCurrency(options?: any): PropertyDecorator;
  export function IsFQDN(options?: any): PropertyDecorator;
  export function IsFullWidth(options?: any): PropertyDecorator;
  export function IsHalfWidth(options?: any): PropertyDecorator;
  export function IsVariableWidth(options?: any): PropertyDecorator;
  export function IsHexColor(options?: any): PropertyDecorator;
  export function IsHexadecimal(options?: any): PropertyDecorator;
  export function IsISBN(version?: any, options?: any): PropertyDecorator;
  export function IsISIN(options?: any): PropertyDecorator;
  export function IsISO8601(options?: any): PropertyDecorator;
  export function IsJWT(options?: any): PropertyDecorator;
  export function IsLowercase(options?: any): PropertyDecorator;
  export function IsUppercase(options?: any): PropertyDecorator;
  export function IsMobilePhone(locale?: any, options?: any): PropertyDecorator;
  export function IsMongoId(options?: any): PropertyDecorator;
  export function IsMultibyte(options?: any): PropertyDecorator;
  export function IsSurrogatePair(options?: any): PropertyDecorator;
  export function Length(
    min: number,
    max?: number,
    options?: any,
  ): PropertyDecorator;
  export function MaxLength(max: number, options?: any): PropertyDecorator;
  export function Contains(seed: string, options?: any): PropertyDecorator;
  export function NotContains(seed: string, options?: any): PropertyDecorator;
  export function IsEmpty(options?: any): PropertyDecorator;
  export function Equals(comparison: any, options?: any): PropertyDecorator;
  export function NotEquals(comparison: any, options?: any): PropertyDecorator;
  export function IsNotIn(values: Record<string, unknown>[], options?: any): PropertyDecorator;
  export function IsDivisibleBy(num: number, options?: any): PropertyDecorator;
  export function IsPositive(options?: any): PropertyDecorator;
  export function IsNegative(options?: any): PropertyDecorator;
  export function MinDate(date: Date, options?: any): PropertyDecorator;
  export function MaxDate(date: Date, options?: any): PropertyDecorator;
  export function IsLatLong(options?: any): PropertyDecorator;
  export function IsLatitude(options?: any): PropertyDecorator;
  export function IsLongitude(options?: any): PropertyDecorator;
  export function IsMilitaryTime(options?: any): PropertyDecorator;
  export function IsHash(algorithm: string, options?: any): PropertyDecorator;
  export function IsISSN(options?: any): PropertyDecorator;
  export function IsBooleanString(options?: any): PropertyDecorator;
  export function IsBase32(options?: any): PropertyDecorator;
  export function IsBIC(options?: any): PropertyDecorator;
  export function IsBtcAddress(options?: any): PropertyDecorator;
  export function IsDataURI(options?: any): PropertyDecorator;
  export function IsEAN(options?: any): PropertyDecorator;
  export function IsEthereumAddress(options?: any): PropertyDecorator;
  export function IsHSL(options?: any): PropertyDecorator;
  export function IsIBAN(options?: any): PropertyDecorator;
  export function IsIdentityCard(
    locale?: any,
    options?: any,
  ): PropertyDecorator;
  export function IsISRC(options?: any): PropertyDecorator;
  export function IsLocale(options?: any): PropertyDecorator;
  export function IsMagnetURI(options?: any): PropertyDecorator;
  export function IsMimeType(options?: any): PropertyDecorator;
  export function IsOctal(options?: any): PropertyDecorator;
  export function IsPassportNumber(
    countryCode?: any,
    options?: any,
  ): PropertyDecorator;
  export function IsPostalCode(locale?: any, options?: any): PropertyDecorator;
  export function IsRFC3339(options?: any): PropertyDecorator;
  export function IsRgbColor(options?: any): PropertyDecorator;
  export function IsSemVer(options?: any): PropertyDecorator;
  export function IsStrongPassword(options?: any): PropertyDecorator;
  export function IsTimeZone(options?: any): PropertyDecorator;
  export function IsBase58(options?: any): PropertyDecorator;
  export function IsPhoneNumber(region?: any, options?: any): PropertyDecorator;
  export function IsISO31661Alpha2(options?: any): PropertyDecorator;
  export function IsISO31661Alpha3(options?: any): PropertyDecorator;
  export function IsDecimal(options?: any): PropertyDecorator;
  export function IsMacAddress(options?: any): PropertyDecorator;
  export function ArrayContains(
    values: Record<string, unknown>[],
    options?: any,
  ): PropertyDecorator;
  export function ArrayNotContains(
    values: Record<string, unknown>[],
    options?: any,
  ): PropertyDecorator;
  export function IsNotEmptyObject(options?: any): PropertyDecorator;
  export function IsInstance(targetType: any, options?: any): PropertyDecorator;
  export function Allow(options?: any): PropertyDecorator;
  export function IsDefined(options?: any): PropertyDecorator;
  export function Validate(
    constraintClass: any,
    ...args: Record<string, unknown>[]
  ): PropertyDecorator;
  export function ValidateBy(
    options: Record<string, unknown>,
    validationOptions?: any,
  ): PropertyDecorator;
  export function ValidateIf(
    condition: any,
    validationOptions?: any,
  ): PropertyDecorator;
  export function ValidateNested(options?: any): PropertyDecorator;
  export function ValidatePromise(options?: any): PropertyDecorator;

  // Validation functions
  export function validate(object: any, options?: any): Promise<any[]>;
  export function validateSync(object: any, options?: any): Record<string, unknown>[];
  export function validateOrReject(object: any, options?: any): Promise<void>;
  export function registerSchema(schema: any): void;

  // Classes and interfaces
  export class ValidationError {
    target?: any;
    property?: string;
    value?: any;
    constraints?: any;
    children?: ValidationError[];
    contexts?: any;
  }

  export interface ValidatorOptions {
    skipMissingProperties?: boolean;
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    forbidUnknownValues?: boolean;
    disableErrorMessages?: boolean;
    errorHttpStatusCode?: number;
    exceptionFactory?: (errors: ValidationError[]) => any;
    groups?: string[];
    dismissDefaultMessages?: boolean;
    validationError?: {
      target?: boolean;
      value?: boolean;
    };
    stopAtFirstError?: boolean;
  }
}
