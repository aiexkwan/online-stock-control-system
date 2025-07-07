import { 
  calculateNetWeight, 
  PALLET_WEIGHTS, 
  PACKAGE_WEIGHTS 
} from '@/app/constants/grnConstants';

describe('calculateNetWeight - GRN 淨重計算', () => {
  describe('標準計算', () => {
    test('White Dry 托盤配 Bag 包裝', () => {
      const grossWeight = 100;
      const netWeight = calculateNetWeight(grossWeight, 'whiteDry', 'bag');
      const expected = grossWeight - PALLET_WEIGHTS.whiteDry - PACKAGE_WEIGHTS.bag;
      
      expect(netWeight).toBe(expected);
      expect(netWeight).toBe(100 - 14 - 0); // 86 (bag weight is 0)
    });

    test('Chep Wet 托盤配 Still 包裝', () => {
      const grossWeight = 150;
      const netWeight = calculateNetWeight(grossWeight, 'chepWet', 'still');
      const expected = grossWeight - PALLET_WEIGHTS.chepWet - PACKAGE_WEIGHTS.still;
      
      expect(netWeight).toBe(expected);
      expect(netWeight).toBe(150 - 30 - 50); // 70 (chepWet is 30)
    });

    test('Euro 托盤配 Tote 包裝', () => {
      const grossWeight = 100;
      const netWeight = calculateNetWeight(grossWeight, 'euro', 'tote');
      
      expect(netWeight).toBe(100 - 22 - 6); // 72 (tote is 6)
    });

    test('White Wet 托盤配 Octo 包裝', () => {
      const grossWeight = 200;
      const netWeight = calculateNetWeight(grossWeight, 'whiteWet', 'octo');
      
      expect(netWeight).toBe(200 - 18 - 14); // 168 (octo is 14)
    });
  });

  describe('Not Included 情況', () => {
    test('托盤為 Not Included', () => {
      const grossWeight = 100;
      const netWeight = calculateNetWeight(grossWeight, 'notIncluded', 'bag');
      
      expect(netWeight).toBe(100 - 0 - 0); // 100 (bag is 0)
    });

    test('包裝為 Not Included', () => {
      const grossWeight = 100;
      const netWeight = calculateNetWeight(grossWeight, 'whiteDry', 'notIncluded');
      
      expect(netWeight).toBe(100 - 14 - 0); // 86
    });

    test('兩者都為 Not Included', () => {
      const grossWeight = 100;
      const netWeight = calculateNetWeight(grossWeight, 'notIncluded', 'notIncluded');
      
      expect(netWeight).toBe(100); // 毛重等於淨重
    });
  });

  describe('邊界情況', () => {
    test('零重量', () => {
      const netWeight = calculateNetWeight(0, 'whiteDry', 'bag');
      // Math.max(0, ...) 確保不會返回負數
      expect(netWeight).toBe(0); // Math.max(0, 0 - 14 - 1) = 0
    });

    test('負數淨重（毛重小於托盤和包裝總重）', () => {
      const grossWeight = 10;
      const netWeight = calculateNetWeight(grossWeight, 'chepWet', 'still');
      
      // 10 - 38 - 50 = -78, 但 Math.max(0, -78) = 0
      expect(netWeight).toBe(0);
    });

    test('剛好等於托盤和包裝重量', () => {
      const grossWeight = 80; // 30 + 50
      const netWeight = calculateNetWeight(grossWeight, 'chepWet', 'still');
      
      expect(netWeight).toBe(0); // 80 - 30 - 50 = 0
    });

    test('小數點重量', () => {
      const grossWeight = 123.45;
      const netWeight = calculateNetWeight(grossWeight, 'whiteDry', 'bag');
      
      expect(netWeight).toBe(123.45 - 14 - 0); // 109.45 (bag is 0)
      expect(netWeight).toBeCloseTo(109.45, 2);
    });

    test('大數值重量', () => {
      const grossWeight = 9999;
      const netWeight = calculateNetWeight(grossWeight, 'euro', 'tote');
      
      expect(netWeight).toBe(9999 - 22 - 6); // 9971 (tote is 6)
    });
  });

  describe('參數驗證', () => {
    test('無效的托盤類型應使用 0 作為默認值', () => {
      const grossWeight = 100;
      // @ts-ignore - 故意傳入無效類型測試
      const netWeight = calculateNetWeight(grossWeight, 'invalid', 'bag');
      
      expect(netWeight).toBe(100 - 0 - 0); // 100 (bag is 0)
    });

    test('無效的包裝類型應使用 0 作為默認值', () => {
      const grossWeight = 100;
      // @ts-ignore - 故意傳入無效類型測試
      const netWeight = calculateNetWeight(grossWeight, 'whiteDry', 'invalid');
      
      expect(netWeight).toBe(100 - 14 - 0); // 86
    });

    test('兩個都是無效類型', () => {
      const grossWeight = 100;
      // @ts-ignore - 故意傳入無效類型測試
      const netWeight = calculateNetWeight(grossWeight, 'invalid1', 'invalid2');
      
      expect(netWeight).toBe(100); // 100 - 0 - 0
    });
  });

  describe('實際使用案例', () => {
    test('最常見組合：White Dry + Bag', () => {
      const grossWeight = 500;
      const netWeight = calculateNetWeight(grossWeight, 'whiteDry', 'bag');
      
      expect(netWeight).toBe(486); // 500 - 14 - 0 (bag is 0)
    });

    test('最重組合：Chep Wet + Still', () => {
      const grossWeight = 200;
      const netWeight = calculateNetWeight(grossWeight, 'chepWet', 'still');
      
      expect(netWeight).toBe(120); // 200 - 30 - 50 (chepWet is 30)
    });

    test('最輕組合：Not Included + Not Included', () => {
      const grossWeight = 300;
      const netWeight = calculateNetWeight(grossWeight, 'notIncluded', 'notIncluded');
      
      expect(netWeight).toBe(300); // 300 - 0 - 0
    });
  });
});