declare module 'class-transformer' {
  // Common type definitions
  export interface ClassTransformOptions {
    strategy?: 'excludeAll' | 'exposeAll';
    excludeExtraneousValues?: boolean;
    groups?: string[];
    version?: number;
    excludePrefixes?: string[];
    ignoreDecorators?: boolean;
    targetMaps?: any[];
    enableCircularCheck?: boolean;
    enableImplicitConversion?: boolean;
    exposeDefaultValues?: boolean;
    exposeUnsetFields?: boolean;
  }

  export interface ClassConstructor<T = {}> {
    new (...args: any[]): T;
  }

  export interface TypeOptions {
    discriminator?: {
      property: string;
      subTypes: Array<{
        value: any;
        name: string;
      }>;
    };
    keepDiscriminatorProperty?: boolean;
  }

  export interface TypeHelpOptions {
    newObject: any;
    object: any;
    property: string;
  }

  export interface TransformOptions {
    groups?: string[];
    since?: number;
    until?: number;
    toClassOnly?: boolean;
    toPlainOnly?: boolean;
  }

  export interface TransformFnParams {
    value: any;
    key: string;
    obj: any;
    type: any;
    options: ClassTransformOptions;
  }

  export interface ExposeOptions {
    name?: string;
    since?: number;
    until?: number;
    groups?: string[];
    toClassOnly?: boolean;
    toPlainOnly?: boolean;
  }

  export interface ExcludeOptions {
    toClassOnly?: boolean;
    toPlainOnly?: boolean;
  }

  // Decorators
  export function Type(
    typeFunction?: (type?: TypeHelpOptions) => Function,
    options?: TypeOptions,
  ): PropertyDecorator;
  export function Transform(
    transformFn: (params: TransformFnParams) => any,
    options?: TransformOptions,
  ): PropertyDecorator;
  export function Expose(options?: ExposeOptions): PropertyDecorator;
  export function Exclude(options?: ExcludeOptions): PropertyDecorator;
  export function TransformInstanceToPlain(options?: any): PropertyDecorator;
  export function TransformPlainToInstance(options?: any): PropertyDecorator;
  export function TransformInstanceToInstance(options?: any): PropertyDecorator;

  // Transformation functions
  export function plainToClass<T, V>(
    cls: ClassConstructor<T>,
    plain: V,
    options?: ClassTransformOptions,
  ): T;
  export function plainToClass<T, V>(
    cls: ClassConstructor<T>,
    plain: V[],
    options?: ClassTransformOptions,
  ): T[];
  export function plainToInstance<T, V>(
    cls: ClassConstructor<T>,
    plain: V,
    options?: ClassTransformOptions,
  ): T;
  export function plainToInstance<T, V>(
    cls: ClassConstructor<T>,
    plain: V[],
    options?: ClassTransformOptions,
  ): T[];
  export function classToPlain<T>(
    object: T,
    options?: ClassTransformOptions,
  ): Record<string, any>;
  export function classToPlain<T>(
    object: T[],
    options?: ClassTransformOptions,
  ): Record<string, any>[];
  export function instanceToPlain<T>(
    object: T,
    options?: ClassTransformOptions,
  ): Record<string, any>;
  export function instanceToPlain<T>(
    object: T[],
    options?: ClassTransformOptions,
  ): Record<string, any>[];
  export function instanceToInstance<T>(
    object: T,
    options?: ClassTransformOptions,
  ): T;
  export function instanceToInstance<T>(
    object: T[],
    options?: ClassTransformOptions,
  ): T[];
  export function classToClassFromExist<T>(
    object: T,
    fromObject: T,
    options?: ClassTransformOptions,
  ): T;
  export function classToClassFromExist<T>(
    object: T,
    fromObjects: T[],
    options?: ClassTransformOptions,
  ): T[];
  export function classToPlainFromExist<T>(
    object: T,
    plainObject: Record<string, any>,
    options?: ClassTransformOptions,
  ): Record<string, any>;
  export function classToPlainFromExist<T>(
    object: T,
    plainObjects: Record<string, any>[],
    options?: ClassTransformOptions,
  ): Record<string, any>[];
  export function plainToClassFromExist<T, V>(
    clsObject: T,
    plain: V,
    options?: ClassTransformOptions,
  ): T;
  export function plainToClassFromExist<T, V>(
    clsObject: T[],
    plain: V[],
    options?: ClassTransformOptions,
  ): T[];
  export function serialize<T>(
    object: T,
    options?: ClassTransformOptions,
  ): string;
  export function serialize<T>(
    object: T[],
    options?: ClassTransformOptions,
  ): string;
  export function deserialize<T>(
    cls: ClassConstructor<T>,
    json: string,
    options?: ClassTransformOptions,
  ): T;
  export function deserializeArray<T>(
    cls: ClassConstructor<T>,
    json: string,
    options?: ClassTransformOptions,
  ): T[];

  // Class transformer class
  export class ClassTransformer {
    transform(object: any, cls: any, options?: ClassTransformOptions): any;
    plainToClass<T, V>(
      cls: ClassConstructor<T>,
      plain: V,
      options?: ClassTransformOptions,
    ): T;
    plainToClass<T, V>(
      cls: ClassConstructor<T>,
      plain: V[],
      options?: ClassTransformOptions,
    ): T[];
    plainToInstance<T, V>(
      cls: ClassConstructor<T>,
      plain: V,
      options?: ClassTransformOptions,
    ): T;
    plainToInstance<T, V>(
      cls: ClassConstructor<T>,
      plain: V[],
      options?: ClassTransformOptions,
    ): T[];
    classToPlain<T>(
      object: T,
      options?: ClassTransformOptions,
    ): Record<string, any>;
    classToPlain<T>(
      object: T[],
      options?: ClassTransformOptions,
    ): Record<string, any>[];
    instanceToPlain<T>(
      object: T,
      options?: ClassTransformOptions,
    ): Record<string, any>;
    instanceToPlain<T>(
      object: T[],
      options?: ClassTransformOptions,
    ): Record<string, any>[];
    instanceToInstance<T>(object: T, options?: ClassTransformOptions): T;
    instanceToInstance<T>(object: T[], options?: ClassTransformOptions): T[];
    serialize<T>(object: T, options?: ClassTransformOptions): string;
    serialize<T>(object: T[], options?: ClassTransformOptions): string;
    deserialize<T>(
      cls: ClassConstructor<T>,
      json: string,
      options?: ClassTransformOptions,
    ): T;
    deserializeArray<T>(
      cls: ClassConstructor<T>,
      json: string,
      options?: ClassTransformOptions,
    ): T[];
  }
}
