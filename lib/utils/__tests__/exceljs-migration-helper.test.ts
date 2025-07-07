import ExcelJS from 'exceljs';
import {
  jsonToWorksheet,
  setHeaderStyle,
  addBorders,
  mergeCells,
  autoFitColumns,
  setNumberFormat,
  NumberFormats,
  createStyledReport,
  convertColumnWidth,
  applyMerges,
  ColumnConfig
} from '../exceljs-migration-helper';

// Mock ExcelJS
jest.mock('exceljs');

describe('exceljs-migration-helper', () => {
  let mockWorkbook: any;
  let mockWorksheet: any;
  let mockRow: any;
  let mockCell: any;
  let mockColumn: any;

  beforeEach(() => {
    // Setup mock cell
    mockCell = {
      value: 'test',
      fill: null,
      border: null,
      style: {}
    };

    // Setup mock column
    mockColumn = {
      width: 15,
      numFmt: '',
      eachCell: jest.fn((options, callback) => {
        if (typeof options === 'function') {
          callback = options;
        }
        callback(mockCell);
      })
    };

    // Setup mock row
    mockRow = {
      font: {},
      alignment: {},
      height: 20,
      eachCell: jest.fn((callback) => callback(mockCell))
    };

    // Setup mock worksheet
    mockWorksheet = {
      columns: [mockColumn],
      rowCount: 10,
      columnCount: 5,
      getRow: jest.fn().mockReturnValue(mockRow),
      getColumn: jest.fn().mockReturnValue(mockColumn),
      getCell: jest.fn().mockReturnValue(mockCell),
      addRow: jest.fn(),
      mergeCells: jest.fn()
    };

    // Setup mock workbook
    mockWorkbook = {
      creator: '',
      created: null,
      modified: null,
      addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
      xlsx: {
        writeBuffer: jest.fn().mockResolvedValue(Buffer.from('test'))
      }
    };

    // Mock constructor
    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('jsonToWorksheet', () => {
    it('should create worksheet with custom columns', async () => {
      const data = [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 }
      ];
      
      const columns: ColumnConfig[] = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Value', key: 'value', width: 15, style: { font: { bold: true } } }
      ];

      const worksheet = await jsonToWorksheet(mockWorkbook, data, 'TestSheet', columns);

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('TestSheet');
      expect(mockWorksheet.columns).toBeDefined();
      expect(mockWorksheet.addRow).toHaveBeenCalledTimes(2);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(data[0]);
      expect(mockWorksheet.addRow).toHaveBeenCalledWith(data[1]);
    });

    it('should auto-generate columns from data', async () => {
      const data = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' }
      ];

      const worksheet = await jsonToWorksheet(mockWorkbook, data, 'AutoSheet');

      expect(mockWorksheet.columns).toBeDefined();
      expect(mockWorksheet.columns.length).toBe(2);
    });

    it('should handle empty data', async () => {
      const worksheet = await jsonToWorksheet(mockWorkbook, [], 'EmptySheet');

      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('EmptySheet');
      expect(mockWorksheet.addRow).not.toHaveBeenCalled();
    });

    it('should apply column styles', async () => {
      const data = [{ value: 100 }];
      const columns: ColumnConfig[] = [
        { header: 'Value', key: 'value', style: { font: { italic: true } } }
      ];

      await jsonToWorksheet(mockWorkbook, data, 'StyledSheet', columns);

      expect(mockWorksheet.getColumn).toHaveBeenCalled();
      expect(mockColumn.eachCell).toHaveBeenCalled();
    });
  });

  describe('setHeaderStyle', () => {
    it('should apply default header style', () => {
      setHeaderStyle(mockWorksheet);

      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1);
      expect(mockRow.font).toEqual({
        size: 12,
        bold: true,
        color: undefined
      });
      expect(mockRow.alignment).toEqual({
        vertical: 'middle',
        horizontal: 'center'
      });
    });

    it('should apply custom header style', () => {
      setHeaderStyle(mockWorksheet, {
        fontSize: 14,
        bold: false,
        bgColor: 'FF0000FF',
        textColor: 'FFFFFFFF',
        height: 30
      });

      expect(mockRow.font).toEqual({
        size: 14,
        bold: false,
        color: { argb: 'FFFFFFFF' }
      });
      expect(mockRow.height).toBe(30);
      expect(mockRow.eachCell).toHaveBeenCalled();
    });

    it('should handle background color', () => {
      setHeaderStyle(mockWorksheet, { bgColor: 'FFE0E0E0' });

      expect(mockRow.eachCell).toHaveBeenCalled();
      expect(mockCell.fill).toEqual({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      });
    });
  });

  describe('addBorders', () => {
    it('should add borders to specified range', () => {
      addBorders(mockWorksheet, 1, 1, 3, 3);

      expect(mockWorksheet.getCell).toHaveBeenCalledTimes(9); // 3x3 grid
      expect(mockCell.border).toEqual({
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      });
    });

    it('should use custom border style', () => {
      addBorders(mockWorksheet, 1, 1, 1, 1, 'thick');

      expect(mockCell.border).toEqual({
        top: { style: 'thick' },
        left: { style: 'thick' },
        bottom: { style: 'thick' },
        right: { style: 'thick' }
      });
    });

    it('should handle single cell', () => {
      addBorders(mockWorksheet, 5, 5, 5, 5);

      expect(mockWorksheet.getCell).toHaveBeenCalledTimes(1);
      expect(mockWorksheet.getCell).toHaveBeenCalledWith(5, 5);
    });
  });

  describe('mergeCells', () => {
    it('should merge cells with correct parameters', () => {
      mergeCells(mockWorksheet, 1, 1, 2, 3);

      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith(1, 1, 2, 3);
    });

    it('should handle single cell merge', () => {
      mergeCells(mockWorksheet, 5, 5, 5, 5);

      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith(5, 5, 5, 5);
    });
  });

  describe('autoFitColumns', () => {
    it('should adjust column widths based on content', () => {
      mockCell.value = 'This is a long text value';
      mockWorksheet.columns = [mockColumn, mockColumn, mockColumn];

      autoFitColumns(mockWorksheet);

      expect(mockColumn.eachCell).toHaveBeenCalled();
      expect(mockColumn.width).toBe(27); // length + 2
    });

    it('should respect min and max width constraints', () => {
      // Test min width
      mockCell.value = 'abc';
      autoFitColumns(mockWorksheet, 10, 50);
      expect(mockColumn.width).toBe(10); // minWidth

      // Test max width
      mockCell.value = 'a'.repeat(100);
      autoFitColumns(mockWorksheet, 10, 50);
      expect(mockColumn.width).toBe(50); // maxWidth
    });

    it('should handle empty cells', () => {
      mockCell.value = null;
      autoFitColumns(mockWorksheet);
      expect(mockColumn.width).toBe(10); // default minWidth
    });

    it('should handle undefined columns', () => {
      mockWorksheet.columns = [undefined, mockColumn];
      expect(() => autoFitColumns(mockWorksheet)).not.toThrow();
    });
  });

  describe('setNumberFormat', () => {
    it('should set number format for column', () => {
      setNumberFormat(mockWorksheet, 2, '0.00');

      expect(mockWorksheet.getColumn).toHaveBeenCalledWith(2);
      expect(mockColumn.numFmt).toBe('0.00');
    });

    it('should work with predefined formats', () => {
      setNumberFormat(mockWorksheet, 1, NumberFormats.CURRENCY);

      expect(mockColumn.numFmt).toBe('$#,##0.00');
    });
  });

  describe('NumberFormats', () => {
    it('should have all expected formats', () => {
      expect(NumberFormats.INTEGER).toBe('0');
      expect(NumberFormats.DECIMAL_2).toBe('0.00');
      expect(NumberFormats.PERCENTAGE).toBe('0%');
      expect(NumberFormats.CURRENCY).toBe('$#,##0.00');
      expect(NumberFormats.DATE).toBe('yyyy-mm-dd');
      expect(NumberFormats.DATETIME).toBe('yyyy-mm-dd hh:mm:ss');
    });
  });

  describe('createStyledReport', () => {
    it('should create a complete styled report', async () => {
      const data = [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 }
      ];

      const buffer = await createStyledReport(data, 'Test Report');

      expect(ExcelJS.Workbook).toHaveBeenCalled();
      expect(mockWorkbook.creator).toBe('NewPennine WMS');
      expect(mockWorkbook.created).toBeInstanceOf(Date);
      expect(mockWorkbook.modified).toBeInstanceOf(Date);
      expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Test Report');
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('should apply default styles', async () => {
      const data = [{ value: 100 }];
      
      await createStyledReport(data, 'Styled Report');

      // Check header style was applied
      expect(mockWorksheet.getRow).toHaveBeenCalledWith(1);
      expect(mockRow.font.bold).toBe(true);
      
      // Check borders were added
      expect(mockWorksheet.getCell).toHaveBeenCalled();
    });

    it('should handle custom columns', async () => {
      const data = [{ id: 1, name: 'Test' }];
      const columns: ColumnConfig[] = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Name', key: 'name', width: 20 }
      ];

      await createStyledReport(data, 'Custom Report', columns);

      expect(mockWorksheet.columns).toBeDefined();
    });

    it('should handle empty data', async () => {
      const buffer = await createStyledReport([], 'Empty Report');

      expect(buffer).toBeInstanceOf(Buffer);
      expect(mockWorksheet.addRow).not.toHaveBeenCalled();
    });
  });

  describe('convertColumnWidth', () => {
    it('should convert xlsx width to ExcelJS width', () => {
      expect(convertColumnWidth(10)).toBe(70);
      expect(convertColumnWidth(15)).toBe(105);
      expect(convertColumnWidth(20)).toBe(140);
    });

    it('should handle decimal values', () => {
      expect(convertColumnWidth(10.5)).toBe(74); // Rounded
      expect(convertColumnWidth(10.1)).toBe(71); // Rounded
    });

    it('should handle zero and negative values', () => {
      expect(convertColumnWidth(0)).toBe(0);
      expect(convertColumnWidth(-5)).toBe(-35);
    });
  });

  describe('applyMerges', () => {
    it('should apply merge configurations', () => {
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 2, c: 2 }, e: { r: 3, c: 4 } }
      ];

      applyMerges(mockWorksheet, merges);

      expect(mockWorksheet.mergeCells).toHaveBeenCalledTimes(2);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith(1, 1, 2, 2);
      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith(3, 3, 4, 5);
    });

    it('should handle empty merges array', () => {
      applyMerges(mockWorksheet, []);

      expect(mockWorksheet.mergeCells).not.toHaveBeenCalled();
    });

    it('should handle single cell merge', () => {
      const merges = [
        { s: { r: 5, c: 5 }, e: { r: 5, c: 5 } }
      ];

      applyMerges(mockWorksheet, merges);

      expect(mockWorksheet.mergeCells).toHaveBeenCalledWith(6, 6, 6, 6);
    });
  });
});