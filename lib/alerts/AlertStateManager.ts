// Stub implementation for AlertStateManager
export class AlertStateManager {
  private static instance: AlertStateManager;

  private constructor() {}

  static getInstance(): AlertStateManager {
    if (!AlertStateManager.instance) {
      AlertStateManager.instance = new AlertStateManager();
    }
    return AlertStateManager.instance;
  }

  async getState(alertId: string) {
    // Stub implementation
    return { state: 'ACTIVE' };
  }

  async updateState(alertId: string, newState: string) {
    // Stub implementation
    return { success: true, state: newState };
  }
}
