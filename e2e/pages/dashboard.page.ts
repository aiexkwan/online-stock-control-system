import { Page, Locator } from '@playwright/test';

/**
 * 儀表板頁面對象模型
 */
export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly navigationMenu: Locator;
  readonly userProfile: Locator;
  readonly statsCards: Locator;
  readonly recentActivitySection: Locator;
  readonly chartContainers: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.navigationMenu = page.locator('nav[role="navigation"]');
    this.userProfile = page.locator('[data-testid="user-profile"]');
    this.statsCards = page.locator('[data-testid="stats-card"]');
    this.recentActivitySection = page.locator('[data-testid="recent-activity"]');
    this.chartContainers = page.locator('[data-testid="chart-container"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    // 等待統計卡片加載
    await this.statsCards.first().waitFor({ state: 'visible' });
    // 等待圖表容器加載
    await this.chartContainers.first().waitFor({ state: 'visible' });
  }

  async getStatsCount(): Promise<number> {
    return await this.statsCards.count();
  }

  async getStatValue(index: number): Promise<string> {
    const stat = this.statsCards.nth(index);
    return (await stat.locator('[data-testid="stat-value"]').textContent()) || '';
  }

  async navigateTo(menuItem: string) {
    await this.navigationMenu.locator(`text="${menuItem}"`).click();
  }

  async isChartLoaded(chartIndex: number = 0): Promise<boolean> {
    const chart = this.chartContainers.nth(chartIndex);
    const canvas = chart.locator('canvas, svg');
    return await canvas.isVisible();
  }

  async getRecentActivityItems(): Promise<string[]> {
    const items = await this.recentActivitySection.locator('li').allTextContents();
    return items;
  }
}
