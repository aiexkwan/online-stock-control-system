/**
 * Mock for PrintHistoryService
 */

export class PrintHistoryService {
  record = jest.fn().mockResolvedValue(undefined);
  getById = jest.fn().mockResolvedValue(null);
  getHistory = jest.fn().mockResolvedValue([]);
  getStatistics = jest.fn().mockResolvedValue({
    totalJobs: 0,
    successRate: 100,
    averageTime: 0,
    byType: {},
    byUser: {},
    errorRate: 0,
  });
  deleteHistory = jest.fn().mockResolvedValue(true);
  cleanupOldHistory = jest.fn().mockResolvedValue(0);
}
