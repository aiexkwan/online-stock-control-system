import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    
    const result = cn(
      'base-class',
      isActive && 'active-class',
      isDisabled && 'disabled-class'
    );
    
    expect(result).toBe('base-class active-class');
  });

  it('should merge tailwind conflicts correctly', () => {
    // twMerge should resolve conflicts - later classes win
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
    
    const result2 = cn('p-4', 'p-2');
    expect(result2).toBe('p-2');
    
    const result3 = cn('mt-4 mb-4', 'my-2');
    expect(result3).toBe('my-2');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['text-sm', 'font-bold'], 'text-red-500');
    expect(result).toBe('text-sm font-bold text-red-500');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
      'font-bold': true
    });
    
    expect(result).toBe('text-red-500 font-bold');
  });

  it('should filter out falsy values', () => {
    const result = cn(
      'base-class',
      null,
      undefined,
      false,
      '',
      0,
      'valid-class'
    );
    
    expect(result).toBe('base-class valid-class');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should handle complex nested structures', () => {
    const result = cn(
      'base',
      ['array-class-1', 'array-class-2'],
      {
        'object-class-1': true,
        'object-class-2': false
      },
      'string-class'
    );
    
    expect(result).toContain('base');
    expect(result).toContain('array-class-1');
    expect(result).toContain('array-class-2');
    expect(result).toContain('object-class-1');
    expect(result).not.toContain('object-class-2');
    expect(result).toContain('string-class');
  });

  it('should handle responsive and variant classes', () => {
    const result = cn(
      'text-sm md:text-base lg:text-lg',
      'hover:bg-gray-100 active:bg-gray-200'
    );
    
    expect(result).toBe('text-sm md:text-base lg:text-lg hover:bg-gray-100 active:bg-gray-200');
  });

  it('should properly merge spacing utilities', () => {
    // Test margin merging
    expect(cn('m-4', 'mt-2')).toBe('m-4 mt-2');
    expect(cn('mx-4', 'ml-2')).toBe('mx-4 ml-2');
    
    // Test padding merging
    expect(cn('p-4', 'pt-2')).toBe('p-4 pt-2');
    expect(cn('py-4', 'pb-2')).toBe('py-4 pb-2');
  });

  it('should handle arbitrary values', () => {
    const result = cn(
      'w-[100px]',
      'h-[200px]',
      'text-[#123456]'
    );
    
    expect(result).toBe('w-[100px] h-[200px] text-[#123456]');
  });

  it('should merge color utilities correctly', () => {
    // Background colors
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    
    // Text colors
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    
    // Border colors
    expect(cn('border-red-500', 'border-blue-500')).toBe('border-blue-500');
  });

  it('should handle CSS variable based classes', () => {
    const result = cn(
      'bg-primary',
      'text-primary-foreground',
      'border-secondary'
    );
    
    expect(result).toBe('bg-primary text-primary-foreground border-secondary');
  });
});