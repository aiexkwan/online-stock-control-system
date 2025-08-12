import {
  SearchType,
  SEARCH_PATTERNS,
  detectSearchType,
  formatPalletNumber,
  isValidPalletNumber,
  isValidSeriesNumber,
  extractFromQRCode,
  generateSearchSuggestions
} from '../palletSearchUtils';

describe('palletSearchUtils', () => {
  describe('SEARCH_PATTERNS', () => {
    it('should have series and pallet patterns defined', () => {
      expect(SEARCH_PATTERNS.series).toBeDefined();
      expect(SEARCH_PATTERNS.pallet).toBeDefined();
      expect(Array.isArray(SEARCH_PATTERNS.series)).toBe(true);
      expect(Array.isArray(SEARCH_PATTERNS.pallet)).toBe(true);
    });
  });

  describe('detectSearchType', () => {
    describe('series detection', () => {
      const seriesTestCases = [
        'PM-240615',
        'PT-240615',
        'ABC-123456',
        'PM-2024-060615',
        'ACO-FEB24',
        'TEST-CODE',
        'A1B2C3D4E5F6', // 12-digit alphanumeric
        'ABC123DEF456'  // 12-digit alphanumeric
      ];

      seriesTestCases.forEach(input => {
        it(`should detect "${input}" as series`, () => {
          expect(detectSearchType(input)).toBe('series');
        });
      });

      it('should detect series with heuristic (contains - but not /)', () => {
        expect(detectSearchType('CUSTOM-FORMAT')).toBe('series');
        expect(detectSearchType('A-B-C-D')).toBe('series');
      });

      it('should detect 12-digit alphanumeric as series', () => {
        expect(detectSearchType('A1B2C3D4E5F6')).toBe('series');
        expect(detectSearchType('123ABC456DEF')).toBe('series');
        // Should not detect pure numbers or pure letters
        expect(detectSearchType('123456789012')).toBe('unknown');
        expect(detectSearchType('ABCDEFGHIJKL')).toBe('unknown');
      });
    });

    describe('pallet number detection', () => {
      const palletTestCases = [
        '240615/1',
        '240615/12',
        '240615/123',
        '240615-1',
        '240615-99',
        'PLT-240615/1',
        'PLT-240615/999'
      ];

      palletTestCases.forEach(input => {
        it(`should detect "${input}" as pallet_num`, () => {
          expect(detectSearchType(input)).toBe('pallet_num');
        });
      });

      it('should detect pallet with heuristic (contains /)', () => {
        expect(detectSearchType('123456/789')).toBe('pallet_num');
        expect(detectSearchType('ABC/123')).toBe('pallet_num');
      });
    });

    describe('edge cases', () => {
      it('should handle empty or invalid input', () => {
        expect(detectSearchType('')).toBe('unknown');
        expect(detectSearchType(null as any)).toBe('unknown');
        expect(detectSearchType(undefined as any)).toBe('unknown');
        expect(detectSearchType(123 as any)).toBe('unknown');
      });

      it('should handle lowercase input', () => {
        expect(detectSearchType('pm-240615')).toBe('series');
        expect(detectSearchType('plt-240615/1')).toBe('pallet_num');
      });

      it('should handle whitespace', () => {
        expect(detectSearchType('  PM-240615  ')).toBe('series');
        expect(detectSearchType('\t240615/1\n')).toBe('pallet_num');
      });

      it('should return unknown for unmatched patterns', () => {
        expect(detectSearchType('random text')).toBe('unknown');
        expect(detectSearchType('12345')).toBe('unknown');
        expect(detectSearchType('!@#$%')).toBe('unknown');
      });
    });
  });

  describe('formatPalletNumber', () => {
    it('should remove PLT- prefix', () => {
      expect(formatPalletNumber('PLT-240615/1')).toBe('240615/1');
      expect(formatPalletNumber('plt-240615/1')).toBe('240615/1');
    });

    it('should replace - with /', () => {
      expect(formatPalletNumber('240615-1')).toBe('240615/1');
      expect(formatPalletNumber('PLT-240615-1')).toBe('240615/1');
    });

    it('should handle already formatted numbers', () => {
      expect(formatPalletNumber('240615/1')).toBe('240615/1');
    });

    it('should handle edge cases', () => {
      expect(formatPalletNumber('')).toBe('');
      expect(formatPalletNumber('123')).toBe('123');
    });
  });

  describe('isValidPalletNumber', () => {
    it('should validate correct pallet numbers', () => {
      expect(isValidPalletNumber('240615/1')).toBe(true);
      expect(isValidPalletNumber('240615/123')).toBe(true);
      expect(isValidPalletNumber('240615-1')).toBe(true);
      expect(isValidPalletNumber('PLT-240615/1')).toBe(true);
    });

    it('should reject invalid pallet numbers', () => {
      expect(isValidPalletNumber('240615')).toBe(false);
      expect(isValidPalletNumber('240615/')).toBe(false);
      expect(isValidPalletNumber('/123')).toBe(false);
      expect(isValidPalletNumber('ABC/123')).toBe(false);
      expect(isValidPalletNumber('')).toBe(false);
    });
  });

  describe('isValidSeriesNumber', () => {
    it('should validate correct series numbers', () => {
      expect(isValidSeriesNumber('PM-240615')).toBe(true);
      expect(isValidSeriesNumber('PM-2024-060615')).toBe(true);
      expect(isValidSeriesNumber('ACO-FEB24')).toBe(true);
      expect(isValidSeriesNumber('TEST-CODE')).toBe(true);
      expect(isValidSeriesNumber('A1B2C3D4E5F6')).toBe(true);
    });

    it('should handle case insensitive', () => {
      expect(isValidSeriesNumber('pm-240615')).toBe(true);
      expect(isValidSeriesNumber('Pm-240615')).toBe(true);
    });

    it('should reject invalid series numbers', () => {
      expect(isValidSeriesNumber('240615/1')).toBe(false);
      expect(isValidSeriesNumber('123456789012')).toBe(false); // Pure numbers
      expect(isValidSeriesNumber('ABCDEFGHIJKL')).toBe(false); // Pure letters
      expect(isValidSeriesNumber('')).toBe(false);
      expect(isValidSeriesNumber('!@#$%')).toBe(false);
    });

    it('should validate 12-digit alphanumeric with mixed content', () => {
      expect(isValidSeriesNumber('A1B2C3D4E5F6')).toBe(true);
      expect(isValidSeriesNumber('1A2B3C4D5E6F')).toBe(true);
      expect(isValidSeriesNumber('AAAAAA123456')).toBe(true);
      expect(isValidSeriesNumber('123456AAAAAA')).toBe(true);
    });
  });

  describe('extractFromQRCode', () => {
    it('should extract from JSON format QR codes', () => {
      const jsonQR = JSON.stringify({ series: 'PM-240615' });
      const result = extractFromQRCode(jsonQR);
      expect(result.value).toBe('PM-240615');
      expect(result.type).toBe('series');
    });

    it('should extract pallet from JSON format', () => {
      const jsonQR = JSON.stringify({ pallet: '240615/1' });
      const result = extractFromQRCode(jsonQR);
      expect(result.value).toBe('240615/1');
      expect(result.type).toBe('pallet_num');
    });

    it('should handle plt_num alternative key', () => {
      const jsonQR = JSON.stringify({ plt_num: '240615/2' });
      const result = extractFromQRCode(jsonQR);
      expect(result.value).toBe('240615/2');
      expect(result.type).toBe('pallet_num');
    });

    it('should handle plain text QR codes', () => {
      expect(extractFromQRCode('PM-240615')).toEqual({
        value: 'PM-240615',
        type: 'series'
      });

      expect(extractFromQRCode('240615/1')).toEqual({
        value: '240615/1',
        type: 'pallet_num'
      });
    });

    it('should handle malformed JSON', () => {
      const result = extractFromQRCode('{invalid json}');
      expect(result.value).toBe('{invalid json}');
      expect(result.type).toBe('unknown');
    });

    it('should handle whitespace', () => {
      const result = extractFromQRCode('  PM-240615  ');
      expect(result.value).toBe('PM-240615');
      expect(result.type).toBe('series');
    });

    it('should handle empty QR code', () => {
      const result = extractFromQRCode('');
      expect(result.value).toBe('');
      expect(result.type).toBe('unknown');
    });

    it('should handle complex JSON with extra fields', () => {
      const jsonQR = JSON.stringify({
        series: 'PM-240615',
        timestamp: '2024-01-15',
        user: 'test'
      });
      const result = extractFromQRCode(jsonQR);
      expect(result.value).toBe('PM-240615');
      expect(result.type).toBe('series');
    });
  });

  describe('generateSearchSuggestions', () => {
    const recentSearches = [
      'PM-240615',
      'PM-240616',
      'PT-240617',
      '240615/1',
      '240615/2',
      'ACO-FEB24',
      'ACO-MAR24'
    ];

    it('should return recent searches when input is empty', () => {
      const suggestions = generateSearchSuggestions('', recentSearches);
      expect(suggestions).toEqual(recentSearches.slice(0, 5));
      expect(suggestions).toHaveLength(5);
    });

    it('should filter searches based on input', () => {
      const suggestions = generateSearchSuggestions('PM', recentSearches);
      expect(suggestions).toEqual(['PM-240615', 'PM-240616']);
    });

    it('should be case insensitive', () => {
      const suggestions = generateSearchSuggestions('pm', recentSearches);
      expect(suggestions).toEqual(['PM-240615', 'PM-240616']);
    });

    it('should match partial strings', () => {
      const suggestions = generateSearchSuggestions('240615', recentSearches);
      expect(suggestions).toEqual(['PM-240615', '240615/1', '240615/2']);
    });

    it('should limit results to 5', () => {
      const manySuggestions = Array(10).fill('PM-240615');
      const suggestions = generateSearchSuggestions('PM', manySuggestions);
      expect(suggestions).toHaveLength(5);
    });

    it('should handle no recent searches', () => {
      const suggestions = generateSearchSuggestions('PM');
      expect(suggestions).toEqual([]);
    });

    it('should handle no matches', () => {
      const suggestions = generateSearchSuggestions('XYZ', recentSearches);
      expect(suggestions).toEqual([]);
    });

    it('should handle special characters in input', () => {
      const suggestions = generateSearchSuggestions('ACO-', recentSearches);
      expect(suggestions).toEqual(['ACO-FEB24', 'ACO-MAR24']);
    });
  });
});
