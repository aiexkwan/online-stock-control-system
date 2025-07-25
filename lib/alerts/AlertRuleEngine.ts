// Stub implementation for AlertRuleEngine
import {
  RuleEvaluationContext,
  AlertRuleDefinition,
  RuleEvaluationResult,
  AddRuleResult,
} from './types/alert-types';

export class AlertRuleEngine {
  private static instance: AlertRuleEngine;

  private constructor() {}

  static getInstance(): AlertRuleEngine {
    if (!AlertRuleEngine.instance) {
      AlertRuleEngine.instance = new AlertRuleEngine();
    }
    return AlertRuleEngine.instance;
  }

  async evaluateRules(context: RuleEvaluationContext): Promise<RuleEvaluationResult> {
    // Stub implementation
    return { evaluated: 0, triggered: [] };
  }

  async addRule(rule: AlertRuleDefinition): Promise<AddRuleResult> {
    // Stub implementation
    return { success: true, ruleId: 'stub-rule-id' };
  }
}
