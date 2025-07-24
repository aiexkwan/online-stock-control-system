// Stub implementation for NotificationService
export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendNotification(alertId: string, channels: string[]) {
    // Stub implementation
    return { success: true, sentChannels: channels };
  }

  async getNotificationHistory(alertId: string) {
    // Stub implementation
    return [];
  }
}