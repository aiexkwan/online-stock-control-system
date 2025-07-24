// Stub implementation for AlertMonitoringService
export class AlertMonitoringService {
  private static instance: AlertMonitoringService;

  private constructor() {}

  static getInstance(): AlertMonitoringService {
    if (!AlertMonitoringService.instance) {
      AlertMonitoringService.instance = new AlertMonitoringService();
    }
    return AlertMonitoringService.instance;
  }

  async checkAllAlerts() {
    // Stub implementation
    return { checked: 0, errors: [] };
  }

  async checkAlert(id: string) {
    // Stub implementation
    return { success: true };
  }
}