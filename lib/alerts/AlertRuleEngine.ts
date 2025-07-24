// Stub implementation for AlertRuleEngine
export class AlertRuleEngine {
  private static instance: AlertRuleEngine;

  private constructor() {}

  static getInstance(): AlertRuleEngine {
    if (!AlertRuleEngine.instance) {
      AlertRuleEngine.instance = new AlertRuleEngine();
    }
    return AlertRuleEngine.instance;
  }

  async evaluateRules(context: any) {
    // Stub implementation
    return { evaluated: 0, triggered: [] };
  }

  async addRule(rule: any) {
    // Stub implementation
    return { success: true, ruleId: 'stub-rule-id' };
  }
}