import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { StatsResponseDto } from './dto/stats-response.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import {
  InventoryAnalysisResponseDto,
  InventoryAnalysisItemDto,
  WarehouseAnalysisDto,
  InventoryTurnoverDto,
} from './dto/inventory-analysis-response.dto';
import {
  StatsCardQueryDto,
  StatsCardDataSource,
} from './dto/stats-card-query.dto';
import { StatsCardResponseDto } from './dto/stats-card-response.dto';
import { WidgetCacheService } from './cache/widget-cache.service';
import { InventoryOrderedAnalysisQueryDto } from './dto/inventory-ordered-analysis-query.dto';
import {
  InventoryOrderedAnalysisResponseDto,
  ProductAnalysisDto,
  AnalysisSummaryDto,
} from './dto/inventory-ordered-analysis-response.dto';
import { ProductDistributionQueryDto } from './dto/product-distribution-query.dto';
import {
  ProductDistributionResponseDto,
  ProductDistributionItemDto,
} from './dto/product-distribution-response.dto';
import { TransactionReportQueryDto } from './dto/transaction-report-query.dto';
import {
  TransactionReportResponseDto,
  TransactionReportItemDto,
  TransactionReportSummaryDto,
} from './dto/transaction-report-response.dto';
import { TopProductsByQuantityQueryDto } from './dto/top-products-by-quantity-query.dto';
import {
  TopProductsByQuantityResponseDto,
  TopProductItemDto,
  TopProductsByQuantityMetadataDto,
} from './dto/top-products-by-quantity-response.dto';
import { ProductionDetailsQueryDto } from './dto/production-details-query.dto';
import {
  ProductionDetailsResponseDto,
  ProductionDetailsItemDto,
  ProductionDetailsMetadataDto,
} from './dto/production-details-response.dto';
import { StaffWorkloadQueryDto } from './dto/staff-workload-query.dto';
import {
  StaffWorkloadResponseDto,
  StaffWorkloadItemDto,
  StaffWorkloadSummaryDto,
  StaffWorkloadMetadataDto,
} from './dto/staff-workload-response.dto';
import { StockDistributionQueryDto } from '../inventory/dto/stock-distribution-query.dto';
import {
  StockDistributionResponseDto,
  StockDistributionItemDto,
} from '../inventory/dto/stock-distribution-response.dto';

@Injectable()
export class WidgetsService {
  private supabase: SupabaseClient;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cacheService: WidgetCacheService,
  ) {
    this.supabase = this.supabaseService.getClient();
  }

  async getStats(
    startDate?: string,
    endDate?: string,
  ): Promise<StatsResponseDto> {
    // Check cache first
    const cacheKey = this.cacheService.generateKey('stats', {
      startDate,
      endDate,
    });
    const cachedData = this.cacheService.get<StatsResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        totalPallets: 0,
        activeTransfers: 0,
        todayGRN: 0,
        pendingOrders: 0,
        timestamp: new Date().toISOString(),
        error: 'Database connection not available',
      };
    }

    try {
      // Get total pallets
      const { count: totalPallets } = await this.supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .eq('is_void', false);

      // Get active transfers
      const { count: activeTransfers } = await this.supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .is('transfer_to_clock_number', null);

      // Get today's GRN count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayGRN } = await this.supabase
        .from('record_grn')
        .select('*', { count: 'exact', head: true })
        .gte('time', `${today}T00:00:00`)
        .lte('time', `${today}T23:59:59`);

      // Get pending orders
      const { count: pendingOrders } = await this.supabase
        .from('record_aco')
        .select('*', { count: 'exact', head: true })
        .eq('is_complete', false);

      const result = {
        totalPallets: totalPallets || 0,
        activeTransfers: activeTransfers || 0,
        todayGRN: todayGRN || 0,
        pendingOrders: pendingOrders || 0,
        timestamp: new Date().toISOString(),
      };

      // Cache the result for 2 minutes
      this.cacheService.set(cacheKey, result, 2 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  async getInventory(
    warehouse?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<InventoryResponseDto> {
    if (!this.supabase) {
      return {
        data: [],
        total: 0,
        limit,
        offset,
        error: 'Database connection not available',
      };
    }

    try {
      const query = this.supabase
        .from('record_inventory')
        .select(
          `
          *,
          data_code(code, description, type),
          record_palletinfo(*)
        `,
          { count: 'exact' },
        )
        .order('latest_update', { ascending: false })
        .range(offset, offset + limit - 1);

      // Note: warehouse filtering not available - record_inventory has no whouse column

      const { data, count, error } = await query;

      if (error) throw error;

      // Transform the data to a cleaner format
      const transformedData =
        data?.map((item) => ({
          id: item.uuid,
          palletId: item.plt_num,
          productCode: item.product_code,
          productDescription: item.data_code?.description || '',
          quantity:
            (item.injection || 0) +
            (item.pipeline || 0) +
            (item.prebook || 0) +
            (item.await || 0) +
            (item.fold || 0) +
            (item.bulk || 0) +
            (item.backcarpark || 0) +
            (item.damage || 0) +
            (item.await_grn || 0),
          unit: '',
          material: '',
          warehouse: '', // No warehouse column in record_inventory
          location: '', // No location column in record_palletinfo
          timestamp: item.latest_update,
        })) || [];

      return {
        data: transformedData,
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  async getDashboardStats(
    startDate?: string,
    endDate?: string,
  ): Promise<StatsResponseDto> {
    // Enhanced dashboard stats with additional metrics
    return this.getStats(startDate, endDate);
  }

  async getInventoryAnalysis(
    warehouse?: string,
  ): Promise<InventoryAnalysisResponseDto> {
    // Check cache first
    const cacheKey = this.cacheService.generateKey('inventory-analysis', {
      warehouse,
    });
    const cachedData =
      this.cacheService.get<InventoryAnalysisResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        summary: {
          totalProducts: 0,
          totalQuantity: 0,
          totalPallets: 0,
          totalWarehouses: 0,
          lastUpdate: new Date().toISOString(),
        },
        productAnalysis: [],
        warehouseAnalysis: [],
        turnoverAnalysis: [],
        alerts: {
          lowStock: [],
          overstock: [],
          slowMoving: [],
        },
        timestamp: new Date().toISOString(),
        error: 'Database connection not available',
      };
    }

    try {
      // Build base query
      const baseQuery = this.supabase.from('record_inventory').select(
        `
          *,
          data_code(code, description, type),
          record_palletinfo(*)
        `,
      );

      // Note: warehouse filtering not available - record_inventory has no whouse column

      const { data: inventoryData, error: inventoryError } = await baseQuery;

      if (inventoryError) throw inventoryError;

      // Process inventory data for analysis
      const productMap = new Map<string, InventoryAnalysisItemDto>();
      const warehouseMap = new Map<string, WarehouseAnalysisDto>();

      let totalQuantity = 0;
      let totalPallets = 0;
      const uniqueWarehouses = new Set<string>();

      inventoryData?.forEach((item) => {
        const productCode = item.product_code;
        const productDescription = item.data_code?.description || '';
        const quantity =
          (item.injection || 0) +
          (item.pipeline || 0) +
          (item.prebook || 0) +
          (item.await || 0) +
          (item.fold || 0) +
          (item.bulk || 0) +
          (item.backcarpark || 0) +
          (item.damage || 0) +
          (item.await_grn || 0);
        const unit = '';
        const material = '';
        const location = ''; // No location column in record_palletinfo
        const itemWarehouse = 'Unknown'; // No warehouse column

        totalQuantity += quantity;
        totalPallets += 1;
        uniqueWarehouses.add(itemWarehouse);

        // Product analysis
        if (!productMap.has(productCode)) {
          productMap.set(productCode, {
            productCode,
            productDescription,
            totalQuantity: 0,
            unit: '',
            material: '',
            totalPallets: 0,
            averageQuantityPerPallet: 0,
            locations: [],
            warehouses: [],
            lastUpdate: item.latest_update,
          });
        }

        const productAnalysis = productMap.get(productCode);
        productAnalysis.totalQuantity += quantity;
        productAnalysis.totalPallets += 1;

        if (!productAnalysis.locations.includes(location)) {
          productAnalysis.locations.push(location);
        }

        if (!productAnalysis.warehouses.includes(itemWarehouse)) {
          productAnalysis.warehouses.push(itemWarehouse);
        }

        // Warehouse analysis
        if (!warehouseMap.has(itemWarehouse)) {
          warehouseMap.set(itemWarehouse, {
            warehouse: itemWarehouse,
            totalProducts: 0,
            totalQuantity: 0,
            totalPallets: 0,
            utilizationRate: 0,
            topProducts: [],
          });
        }

        const warehouseAnalysis = warehouseMap.get(itemWarehouse);
        warehouseAnalysis.totalQuantity += quantity;
        warehouseAnalysis.totalPallets += 1;
      });

      // Calculate averages and final metrics
      const productAnalysis = Array.from(productMap.values()).map((product) => {
        product.averageQuantityPerPallet =
          product.totalQuantity / product.totalPallets;
        return product;
      });

      const warehouseAnalysis = Array.from(warehouseMap.values()).map(
        (warehouse) => {
          warehouse.totalProducts = productAnalysis.filter((p) =>
            p.warehouses.includes(warehouse.warehouse),
          ).length;
          warehouse.utilizationRate =
            warehouse.totalQuantity / (warehouse.totalPallets * 1000); // Assuming 1000 as max capacity per pallet
          warehouse.topProducts = productAnalysis
            .filter((p) => p.warehouses.includes(warehouse.warehouse))
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 5);
          return warehouse;
        },
      );

      // Simple turnover analysis (mock data for now)
      const turnoverAnalysis: InventoryTurnoverDto[] = productAnalysis.map(
        (product) => ({
          productCode: product.productCode,
          averageTurnover: Math.random() * 30, // Mock turnover rate
          fastMoving: product.totalQuantity > 1000,
          slowMoving: product.totalQuantity < 100,
          daysInStock: Math.floor(Math.random() * 365),
        }),
      );

      // Generate alerts
      const lowStockThreshold = 50;
      const overstockThreshold = 2000;
      const slowMovingThreshold = 30;

      const alerts = {
        lowStock: productAnalysis.filter(
          (p) => p.totalQuantity < lowStockThreshold,
        ),
        overstock: productAnalysis.filter(
          (p) => p.totalQuantity > overstockThreshold,
        ),
        slowMoving: turnoverAnalysis
          .filter((t) => t.daysInStock > slowMovingThreshold)
          .map((t) =>
            productAnalysis.find((p) => p.productCode === t.productCode),
          )
          .filter(Boolean),
      };

      const result = {
        summary: {
          totalProducts: productMap.size,
          totalQuantity,
          totalPallets,
          totalWarehouses: uniqueWarehouses.size,
          lastUpdate: new Date().toISOString(),
        },
        productAnalysis: productAnalysis.sort(
          (a, b) => b.totalQuantity - a.totalQuantity,
        ),
        warehouseAnalysis,
        turnoverAnalysis,
        alerts,
        timestamp: new Date().toISOString(),
      };

      // Cache the result for 10 minutes
      this.cacheService.set(cacheKey, result, 10 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error fetching inventory analysis:', error);
      throw error;
    }
  }

  async getStatsCard(query: StatsCardQueryDto): Promise<StatsCardResponseDto> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.cacheService.generateKey('stats-card', query);
    const cachedData = this.cacheService.get<StatsCardResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        value: 0,
        label: query.label || 'Unavailable',
        timestamp: new Date().toISOString(),
        error: 'Database connection not available',
      };
    }

    try {
      let value: number | string = 0;
      let trend: number | undefined;
      const label = query.label || this.getDefaultLabel(query.dataSource);

      // Get current value based on data source
      const currentValue = await this.getStatsCardValue(
        query.dataSource,
        query,
      );
      value = currentValue;

      // Calculate trend if date range is provided
      if (query.startDate && query.endDate) {
        trend = await this.calculateTrend(query.dataSource, query);
      }

      const calculationTime = Date.now() - startTime;

      const result: any = {
        value,
        label,
        dataSource: query.dataSource, // Add dataSource at root level for backward compatibility
        metadata: {
          optimized: true,
          calculationTime: `${calculationTime}ms`,
          dataSource: query.dataSource,
          cached: false,
          lastUpdated: new Date().toISOString(),
          ...(query.warehouse && { warehouse: query.warehouse }), // Add warehouse if provided
        },
        timestamp: new Date().toISOString(),
      };

      if (trend !== undefined) {
        result.trend = trend;
      }

      // Cache the result for 5 minutes
      this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

      return result as StatsCardResponseDto;
    } catch (error) {
      console.error('Error fetching stats card data:', error);
      return {
        value: 0,
        label: query.label || 'Error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  private async getStatsCardValue(
    dataSource: StatsCardDataSource,
    query: StatsCardQueryDto,
  ): Promise<number> {
    switch (dataSource) {
      case StatsCardDataSource.TOTAL_PALLETS:
        return await this.getTotalPallets(query);

      case StatsCardDataSource.TODAY_TRANSFERS:
        return await this.getTodayTransfers(query);

      case StatsCardDataSource.ACTIVE_PRODUCTS:
        return await this.getActiveProducts(query);

      case StatsCardDataSource.PENDING_ORDERS:
        return await this.getPendingOrders(query);

      case StatsCardDataSource.AWAIT_PERCENTAGE_STATS:
        return await this.getAwaitPercentageStats(query);

      case StatsCardDataSource.AWAIT_LOCATION_COUNT:
        return await this.getAwaitLocationCount(query);

      case StatsCardDataSource.TRANSFER_COUNT:
        return await this.getTransferCount(query);

      case StatsCardDataSource.PRODUCTION_STATS:
        return await this.getProductionStats(query);

      case StatsCardDataSource.UPDATE_STATS:
        return await this.getUpdateStats(query);

      default:
        return 0;
    }
  }

  private async getTotalPallets(query: StatsCardQueryDto): Promise<number> {
    let queryBuilder = this.supabase
      .from('record_palletinfo')
      .select('*', { count: 'exact', head: true })
      .eq('is_void', false);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getTodayTransfers(query: StatsCardQueryDto): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    let queryBuilder = this.supabase
      .from('record_transfer')
      .select('*', { count: 'exact', head: true })
      .gte('time', `${today}T00:00:00`)
      .lte('time', `${today}T23:59:59`);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getActiveProducts(query: StatsCardQueryDto): Promise<number> {
    let queryBuilder = this.supabase
      .from('record_inventory')
      .select('code', { count: 'exact', head: true })
      .gt('qty', 0);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getPendingOrders(query: StatsCardQueryDto): Promise<number> {
    let queryBuilder = this.supabase
      .from('record_aco')
      .select('*', { count: 'exact', head: true })
      .eq('is_complete', false);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getAwaitPercentageStats(
    query: StatsCardQueryDto,
  ): Promise<number> {
    // Calculate percentage of items awaiting location
    const totalCount = await this.getTotalPallets(query);
    const awaitCount = await this.getAwaitLocationCount(query);

    if (totalCount === 0) return 0;
    return Math.round((awaitCount / totalCount) * 100);
  }

  private async getAwaitLocationCount(
    query: StatsCardQueryDto,
  ): Promise<number> {
    let queryBuilder = this.supabase
      .from('record_palletinfo')
      .select('*', { count: 'exact', head: true })
      .eq('is_void', false)
      .is('location', null);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getTransferCount(query: StatsCardQueryDto): Promise<number> {
    let queryBuilder = this.supabase
      .from('record_transfer')
      .select('*', { count: 'exact', head: true });

    if (query.startDate && query.endDate) {
      queryBuilder = queryBuilder
        .gte('time', `${query.startDate}T00:00:00`)
        .lte('time', `${query.endDate}T23:59:59`);
    }

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getProductionStats(query: StatsCardQueryDto): Promise<number> {
    // Mock production stats - could be integrated with actual production data
    const today = new Date().toISOString().split('T')[0];
    let queryBuilder = this.supabase
      .from('record_grn')
      .select('*', { count: 'exact', head: true })
      .gte('time', `${today}T00:00:00`)
      .lte('time', `${today}T23:59:59`);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async getUpdateStats(query: StatsCardQueryDto): Promise<number> {
    // Count items that need updates (example: items without recent inventory updates)
    const oneWeekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    let queryBuilder = this.supabase
      .from('record_inventory')
      .select('*', { count: 'exact', head: true })
      .lt('time', oneWeekAgo);

    if (query.warehouse) {
      queryBuilder = queryBuilder.eq('whouse', query.warehouse);
    }

    const { count } = await queryBuilder;
    return count || 0;
  }

  private async calculateTrend(
    dataSource: StatsCardDataSource,
    query: StatsCardQueryDto,
  ): Promise<number> {
    // Calculate trend by comparing current period with previous period
    const currentValue = await this.getStatsCardValue(dataSource, query);

    // Calculate previous period dates
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const previousEndDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(
      previousEndDate.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000,
    );

    const previousQuery: StatsCardQueryDto = {
      dataSource: query.dataSource,
      startDate: previousStartDate.toISOString().split('T')[0] || '',
      endDate: previousEndDate.toISOString().split('T')[0] || '',
      ...(query.warehouse && { warehouse: query.warehouse }),
      ...(query.label && { label: query.label }),
    };

    const previousValue = await this.getStatsCardValue(
      dataSource,
      previousQuery,
    );

    if (previousValue === 0) return 0;

    const trendPercentage =
      ((currentValue - previousValue) / previousValue) * 100;
    return Math.round(trendPercentage * 100) / 100; // Round to 2 decimal places
  }

  async getInventoryOrderedAnalysis(
    query: InventoryOrderedAnalysisQueryDto,
  ): Promise<InventoryOrderedAnalysisResponseDto> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.cacheService.generateKey(
      'inventory-ordered-analysis',
      query,
    );
    const cachedData =
      this.cacheService.get<InventoryOrderedAnalysisResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        products: [],
        summary: {
          totalStock: 0,
          totalDemand: 0,
          totalRemaining: 0,
          overallSufficient: false,
          insufficientCount: 0,
          sufficientCount: 0,
        },
        timestamp: new Date().toISOString(),
        error: 'Database connection not available',
      };
    }

    try {
      // Fetch inventory data
      let inventoryQuery = this.supabase.from('record_inventory').select('*');

      if (query.productCodes && query.productCodes.length > 0) {
        inventoryQuery = inventoryQuery.in('product_code', query.productCodes);
      }

      const { data: inventoryData, error: inventoryError } =
        await inventoryQuery;
      if (inventoryError) throw inventoryError;

      // Fetch order data
      let orderQuery = this.supabase.from('data_order').select('*');

      if (query.productCodes && query.productCodes.length > 0) {
        orderQuery = orderQuery.in('product_code', query.productCodes);
      }

      const { data: orderData, error: orderError } = await orderQuery;
      if (orderError) throw orderError;

      // Fetch product descriptions
      let productQuery = this.supabase
        .from('data_code')
        .select('code, description, type');

      if (query.productType) {
        productQuery = productQuery.eq('type', query.productType);
      }

      if (query.productCodes && query.productCodes.length > 0) {
        productQuery = productQuery.in('code', query.productCodes);
      }

      const { data: productData, error: productError } = await productQuery;
      if (productError) throw productError;

      // Process inventory data
      const inventoryMap = new Map<string, any>();
      inventoryData?.forEach((item) => {
        const totalInventory =
          (item.injection || 0) +
          (item.pipeline || 0) +
          (item.prebook || 0) +
          (item.await || 0) +
          (item.fold || 0) +
          (item.bulk || 0) +
          (item.backcarpark || 0) +
          (item.damage || 0) +
          (item.await_grn || 0);

        if (!inventoryMap.has(item.product_code)) {
          inventoryMap.set(item.product_code, { total: 0 });
        }

        const existing = inventoryMap.get(item.product_code);
        existing.total += totalInventory;
      });

      // Process order data
      const orderMap = new Map<string, any>();
      orderData?.forEach((order) => {
        const loadedQty = parseInt(order.loaded_qty || '0', 10);
        const outstandingQty = order.product_qty - loadedQty;

        if (!orderMap.has(order.product_code)) {
          orderMap.set(order.product_code, {
            totalOutstanding: 0,
          });
        }

        const existing = orderMap.get(order.product_code);
        existing.totalOutstanding += Math.max(0, outstandingQty);
      });

      // Process product data
      const productMap = new Map<string, any>();
      productData?.forEach((product) => {
        productMap.set(product.code, product);
      });

      // Combine all data
      const products: ProductAnalysisDto[] = [];
      const allProductCodes = new Set([
        ...inventoryMap.keys(),
        ...orderMap.keys(),
      ]);

      let totalStock = 0;
      let totalDemand = 0;
      let sufficientCount = 0;
      let insufficientCount = 0;

      allProductCodes.forEach((productCode) => {
        const inventory = inventoryMap.get(productCode);
        const order = orderMap.get(productCode);
        const product = productMap.get(productCode);

        const currentStock = inventory?.total || 0;
        const orderDemand = order?.totalOutstanding || 0;

        // Skip products with no stock and no demand
        if (currentStock === 0 && orderDemand === 0) return;

        const remainingStock = currentStock - orderDemand;
        const fulfillmentRate =
          orderDemand > 0 ? (currentStock / orderDemand) * 100 : 100;
        const isSufficient = currentStock >= orderDemand;

        products.push({
          productCode,
          description: product?.description || '',
          currentStock,
          orderDemand,
          remainingStock,
          fulfillmentRate: Math.min(fulfillmentRate, 100),
          isSufficient,
        });

        totalStock += currentStock;
        totalDemand += orderDemand;
        if (isSufficient) {
          sufficientCount++;
        } else {
          insufficientCount++;
        }
      });

      // Sort products by status and remaining stock
      products.sort((a, b) => {
        if (!a.isSufficient && b.isSufficient) return -1;
        if (a.isSufficient && !b.isSufficient) return 1;
        return a.remainingStock - b.remainingStock;
      });

      const calculationTime = Date.now() - startTime;

      const result: InventoryOrderedAnalysisResponseDto = {
        products,
        summary: {
          totalStock,
          totalDemand,
          totalRemaining: totalStock - totalDemand,
          overallSufficient: totalStock >= totalDemand,
          insufficientCount,
          sufficientCount,
        },
        metadata: {
          executed_at: new Date().toISOString(),
          calculation_time: `${calculationTime}ms`,
          ...(query.warehouse && { warehouse: query.warehouse }),
        },
        timestamp: new Date().toISOString(),
      };

      // Cache the result for 3 minutes
      this.cacheService.set(cacheKey, result, 3 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error fetching inventory ordered analysis:', error);
      return {
        products: [],
        summary: {
          totalStock: 0,
          totalDemand: 0,
          totalRemaining: 0,
          overallSufficient: false,
          insufficientCount: 0,
          sufficientCount: 0,
        },
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  async getProductDistribution(
    query: ProductDistributionQueryDto,
  ): Promise<ProductDistributionResponseDto> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.cacheService.generateKey(
      'product-distribution',
      query,
    );
    const cachedData =
      this.cacheService.get<ProductDistributionResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        value: [],
        timestamp: new Date().toISOString(),
        error: 'Database connection not available',
      };
    }

    try {
      // Call RPC function for optimized product distribution calculation
      const { data, error } = await this.supabase.rpc(
        'get_product_distribution',
        {
          p_limit: query.limit || 10,
        },
      );

      if (error) {
        console.error('RPC error in getProductDistribution:', error);

        // Fallback to direct query if RPC fails
        const { data: inventoryData, error: inventoryError } =
          await this.supabase
            .from('record_inventory')
            .select(
              'product_code, injection, pipeline, await, fold, bulk, prebook, backcarpark, damage, await_grn',
            );

        if (inventoryError) throw inventoryError;

        // Group by product and calculate totals
        const productMap = new Map<string, number>();

        inventoryData?.forEach((item) => {
          const totalQty =
            (item.injection || 0) +
            (item.pipeline || 0) +
            (item.await || 0) +
            (item.fold || 0) +
            (item.bulk || 0) +
            (item.prebook || 0) +
            (item.backcarpark || 0) +
            (item.damage || 0) +
            (item.await_grn || 0);

          const currentTotal = productMap.get(item.product_code) || 0;
          productMap.set(item.product_code, currentTotal + totalQty);
        });

        // Convert to array and sort by quantity
        let distributionData = Array.from(productMap.entries())
          .map(([productCode, totalQty]) => ({
            name: productCode,
            value: totalQty,
          }))
          .filter((item) => item.value > 0)
          .sort((a, b) => b.value - a.value)
          .slice(0, query.limit || 10);

        // Get product descriptions
        if (distributionData.length > 0) {
          const productCodes = distributionData.map((item) => item.name);
          const { data: productData, error: productError } = await this.supabase
            .from('data_code')
            .select('code, description')
            .in('code', productCodes);

          if (!productError && productData) {
            const productDescMap = new Map(
              productData.map((p) => [p.code, p.description]),
            );
            distributionData = distributionData.map((item) => ({
              ...item,
              description: productDescMap.get(item.name) || item.name,
            }));
          }
        }

        // Calculate percentages
        const total = distributionData.reduce(
          (sum, item) => sum + item.value,
          0,
        );
        const resultData: ProductDistributionItemDto[] = distributionData.map(
          (item) => ({
            ...item,
            percentage:
              total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
          }),
        );

        const calculationTime = Date.now() - startTime;

        const result: ProductDistributionResponseDto = {
          value: resultData,
          metadata: {
            executed_at: new Date().toISOString(),
            calculation_time: `${calculationTime}ms`,
            rpcFunction: false,
          },
          timestamp: new Date().toISOString(),
        };

        // Cache for 5 minutes
        this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

        return result;
      }

      // Process RPC result
      const distributionData: ProductDistributionItemDto[] = (data || []).map(
        (item: any) => ({
          name: item.product_code,
          value: item.total_quantity,
          description: item.product_description || item.product_code,
          percentage: item.percentage || 0,
        }),
      );

      const calculationTime = Date.now() - startTime;

      const result: ProductDistributionResponseDto = {
        value: distributionData,
        metadata: {
          executed_at: new Date().toISOString(),
          calculation_time: `${calculationTime}ms`,
          rpcFunction: true,
          rpcName: 'get_product_distribution',
        },
        timestamp: new Date().toISOString(),
      };

      // Cache for 5 minutes
      this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error fetching product distribution:', error);
      return {
        value: [],
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  async getTransactionReport(
    query: TransactionReportQueryDto,
  ): Promise<TransactionReportResponseDto> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.cacheService.generateKey('transaction-report', query);
    const cachedData =
      this.cacheService.get<TransactionReportResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalQuantity: 0,
          uniqueProducts: 0,
          uniqueUsers: 0,
          transactionsByType: {},
        },
        metadata: {
          executed_at: new Date().toISOString(),
          calculation_time: '0ms',
          startDate: query.startDate,
          endDate: query.endDate,
          ...(query.warehouse && { warehouse: query.warehouse }),
        },
        timestamp: new Date().toISOString(),
        error: 'Database connection not available',
      };
    }

    try {
      // Query transactions (transfers and history)
      let transferQuery = this.supabase
        .from('record_transfer')
        .select(
          `
          *,
          user:data_id!record_transfer_userid_fkey(user_id, user_fullname),
          product:data_code!record_transfer_product_code_fkey(code, description)
        `,
        )
        .gte('time', query.startDate)
        .lte('time', query.endDate)
        .order('time', { ascending: false });

      if (query.warehouse) {
        transferQuery = transferQuery.or(
          `from_location.eq.${query.warehouse},to_location.eq.${query.warehouse}`,
        );
      }

      const { data: transferData, error: transferError } = await transferQuery;
      if (transferError) throw transferError;

      // Query history records for other transaction types
      let historyQuery = this.supabase
        .from('record_history')
        .select(
          `
          *,
          user:data_id!record_history_userid_fkey(user_id, user_fullname)
        `,
        )
        .gte('time', query.startDate)
        .lte('time', query.endDate)
        .order('time', { ascending: false });

      if (query.warehouse) {
        historyQuery = historyQuery.or(
          `field1.eq.${query.warehouse},field2.eq.${query.warehouse}`,
        );
      }

      const { data: historyData, error: historyError } = await historyQuery;
      if (historyError) throw historyError;

      // Process transfer data
      const transactions: TransactionReportItemDto[] = [];
      const uniqueProductsSet = new Set<string>();
      const uniqueUsersSet = new Set<string>();
      const transactionsByType: Record<string, number> = {};

      // Process transfers
      transferData?.forEach((transfer) => {
        transactions.push({
          timestamp: transfer.tran_date,
          transactionType: 'Transfer',
          palletId: transfer.pallet_id,
          productCode: transfer.product_code,
          productName: transfer.product?.description || transfer.product_code,
          quantity: transfer.quantity,
          fromLocation: transfer.from_location,
          toLocation: transfer.to_location,
          userId: transfer.userid,
          userName: transfer.user?.user_fullname || transfer.userid,
          notes: transfer.remark,
        });

        uniqueProductsSet.add(transfer.product_code);
        if (transfer.userid) uniqueUsersSet.add(transfer.userid);
        transactionsByType['Transfer'] =
          (transactionsByType['Transfer'] || 0) + 1;
      });

      // Process history records (receipts, adjustments, etc.)
      historyData?.forEach((history) => {
        // Only include relevant history types
        if (
          ['Receipt', 'Adjustment', 'Void', 'Update'].includes(
            history.action_type,
          )
        ) {
          transactions.push({
            timestamp: history.timestamp,
            transactionType: history.action_type,
            palletId: history.pallet_id || '',
            productCode: history.product_code || '',
            productName: history.product_name || history.product_code || '',
            quantity: parseInt(history.quantity || '0', 10),
            fromLocation: history.field1,
            toLocation: history.field2,
            userId: history.userid,
            userName: history.user?.user_fullname || history.userid,
            notes: history.remark,
          });

          if (history.product_code) uniqueProductsSet.add(history.product_code);
          if (history.userid) uniqueUsersSet.add(history.userid);
          transactionsByType[history.action_type] =
            (transactionsByType[history.action_type] || 0) + 1;
        }
      });

      // Calculate summary
      const totalQuantity = transactions.reduce(
        (sum, t) => sum + t.quantity,
        0,
      );

      const calculationTime = Date.now() - startTime;

      const result: TransactionReportResponseDto = {
        transactions,
        summary: {
          totalTransactions: transactions.length,
          totalQuantity,
          uniqueProducts: uniqueProductsSet.size,
          uniqueUsers: uniqueUsersSet.size,
          transactionsByType,
        },
        metadata: {
          executed_at: new Date().toISOString(),
          calculation_time: `${calculationTime}ms`,
          startDate: query.startDate,
          endDate: query.endDate,
          ...(query.warehouse && { warehouse: query.warehouse }),
        },
        timestamp: new Date().toISOString(),
      };

      // Cache for 5 minutes
      this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error fetching transaction report:', error);
      return {
        transactions: [],
        summary: {
          totalTransactions: 0,
          totalQuantity: 0,
          uniqueProducts: 0,
          uniqueUsers: 0,
          transactionsByType: {},
        },
        metadata: {
          executed_at: new Date().toISOString(),
          calculation_time: '0ms',
          startDate: query.startDate,
          endDate: query.endDate,
          ...(query.warehouse && { warehouse: query.warehouse }),
        },
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  async getTopProductsByQuantity(
    query: TopProductsByQuantityQueryDto,
  ): Promise<TopProductsByQuantityResponseDto> {
    const startTime = Date.now();

    try {
      const { limit = 10, warehouse, sortBy = 'quantity', timeRange } = query;

      // Build query conditions
      let queryBuilder = this.supabase.from('record_palletinfo').select(`
          product_code,
          product_qty,
          data_code (
            description,
            colour,
            type
          )
        `);

      // Apply warehouse filter if provided
      if (warehouse) {
        queryBuilder = queryBuilder.eq('warehouse', warehouse);
      }

      // Apply time range filter if provided
      if (timeRange) {
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        queryBuilder = queryBuilder.gte(
          'generate_time',
          startDate.toISOString(),
        );
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Aggregate data by product code
      const productMap = new Map<
        string,
        {
          product_code: string;
          description: string;
          colour?: string;
          type?: string;
          total_quantity: number;
          total_value: number;
          pallet_count: number;
        }
      >();

      data?.forEach((record: any) => {
        const key = record.product_code;
        const existing = productMap.get(key);

        if (existing) {
          existing.total_quantity += record.product_qty || 0;
          existing.pallet_count += 1;
        } else {
          productMap.set(key, {
            product_code: record.product_code,
            description: record.data_code?.[0]?.description || '',
            colour: record.data_code?.[0]?.colour || undefined,
            type: record.data_code?.[0]?.type || undefined,
            total_quantity: record.product_qty || 0,
            total_value: 0, // Would need pricing data
            pallet_count: 1,
          });
        }
      });

      // Sort and limit results
      const products = Array.from(productMap.values())
        .sort((a, b) => {
          if (sortBy === 'quantity') {
            return b.total_quantity - a.total_quantity;
          } else {
            return b.total_value - a.total_value;
          }
        })
        .slice(0, limit);

      const executionTime = Date.now() - startTime;

      return {
        products: products.map((p) => ({
          product_code: p.product_code,
          description: p.description,
          total_quantity: p.total_quantity,
          colour: p.colour || undefined,
          type: p.type || undefined,
          total_value: p.total_value,
          pallet_count: p.pallet_count,
        })),
        metadata: {
          total_products: productMap.size,
          filters: { warehouse, timeRange },
          execution_time_ms: executionTime,
          executed_at: new Date().toISOString(),
          sort_by: sortBy,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching top products by quantity:', error);
      throw error;
    }
  }

  async getProductionDetails(
    query: ProductionDetailsQueryDto,
  ): Promise<ProductionDetailsResponseDto> {
    const startTime = Date.now();

    try {
      const { startDate, endDate, warehouse, productType, limit = 50 } = query;

      let queryBuilder = this.supabase
        .from('record_palletinfo')
        .select(
          `
          plt_num,
          product_code,
          product_qty,
          generate_time,
          plt_remark,
          series,
          pdf_url,
          data_code (
            description,
            colour,
            type
          )
        `,
        )
        .gte('generate_time', startDate)
        .lte('generate_time', endDate)
        .ilike('plt_remark', '%finished in production%')
        .order('generate_time', { ascending: false })
        .limit(limit);

      // Apply warehouse filter if provided (using plt_remark as warehouse info)
      if (warehouse) {
        queryBuilder = queryBuilder.ilike('plt_remark', `%${warehouse}%`);
      }

      // Apply product type filter if provided
      if (productType) {
        queryBuilder = queryBuilder.filter('data_code.type', 'eq', productType);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Calculate metadata
      const totalQuantity =
        data?.reduce((sum, record) => sum + (record.product_qty || 0), 0) || 0;
      const uniqueProducts = new Set(data?.map((record) => record.product_code))
        .size;
      const executionTime = Date.now() - startTime;

      return {
        details:
          data?.map((record) => ({
            plt_num: record.plt_num,
            product_code: record.product_code,
            description: record.data_code?.[0]?.description || '',
            product_qty: record.product_qty,
            generate_time: record.generate_time,
            plt_remark: record.plt_remark,
            series: record.series,
            pdf_url: record.pdf_url,
            colour: record.data_code?.[0]?.colour,
            type: record.data_code?.[0]?.type,
          })) || [],
        metadata: {
          total_records: data?.length || 0,
          unique_products: uniqueProducts,
          total_quantity: totalQuantity,
          filters: { warehouse, productType },
          execution_time_ms: executionTime,
          executed_at: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching production details:', error);
      throw error;
    }
  }

  async getStaffWorkload(
    query: StaffWorkloadQueryDto,
  ): Promise<StaffWorkloadResponseDto> {
    const startTime = Date.now();

    try {
      const {
        startDate,
        endDate,
        department,
        userId,
        actionType = 'QC passed',
      } = query;

      let queryBuilder = this.supabase
        .from('record_history')
        .select(
          `
          id,
          time,
          action,
          plt_num,
          loc,
          remark,
          uuid
        `,
        )
        .gte('time', startDate)
        .lte('time', endDate)
        .ilike('action', `%${actionType}%`)
        .order('time', { ascending: true });

      // Apply filters
      if (department) {
        queryBuilder = queryBuilder.ilike('loc', `%${department}%`);
      }

      if (userId) {
        queryBuilder = queryBuilder.eq('uuid', userId);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Group by date and user
      const workloadMap = new Map<
        string,
        {
          date: string;
          user_id: string;
          task_count: number;
          department?: string;
          action_type: string;
        }
      >();

      data?.forEach((record) => {
        const date: string =
          new Date(record.time || new Date()).toISOString().split('T')[0] ||
          new Date().toISOString().split('T')[0];
        const key = `${date}-${record.uuid}`;

        if (workloadMap.has(key)) {
          workloadMap.get(key).task_count += 1;
        } else {
          workloadMap.set(key, {
            date: date,
            user_id: record.uuid || '',
            task_count: 1,
            department: record.loc,
            action_type: record.action || '',
          });
        }
      });

      const workloadData = Array.from(workloadMap.values());

      // Calculate summary statistics
      const totalTasks = workloadData.reduce((sum, w) => sum + w.task_count, 0);
      const uniqueDays = new Set(workloadData.map((w) => w.date)).size;
      const avgTasksPerDay = uniqueDays > 0 ? totalTasks / uniqueDays : 0;

      // Find peak day
      const dailyTasks = new Map<string, number>();
      workloadData.forEach((w) => {
        dailyTasks.set(w.date, (dailyTasks.get(w.date) || 0) + w.task_count);
      });

      let peakDay = '';
      let peakTasks = 0;
      dailyTasks.forEach((tasks, date) => {
        if (tasks > peakTasks) {
          peakTasks = tasks;
          peakDay = date;
        }
      });

      const activeStaffCount = new Set(workloadData.map((w) => w.user_id)).size;

      const executionTime = Date.now() - startTime;

      return {
        workload: workloadData,
        summary: {
          total_tasks: totalTasks,
          avg_tasks_per_day: Math.round(avgTasksPerDay * 100) / 100,
          peak_day: peakDay,
          peak_tasks: peakTasks,
          active_staff_count: activeStaffCount,
        },
        metadata: {
          filters: { department, userId, actionType },
          execution_time_ms: executionTime,
          executed_at: new Date().toISOString(),
          date_range: { start: startDate, end: endDate },
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching staff workload:', error);
      throw error;
    }
  }

  async getStockDistribution(
    query: StockDistributionQueryDto,
  ): Promise<StockDistributionResponseDto> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.cacheService.generateKey('stock-distribution', query);
    const cachedData =
      this.cacheService.get<StockDistributionResponseDto>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    if (!this.supabase) {
      return {
        data: [],
        total: 0,
        offset: query.offset || 0,
        limit: query.limit || 50,
        error: 'Database connection not available',
      };
    }

    try {
      // Build the query to get stock distribution data
      const { data, error, count } = await this.supabase
        .from('record_inventory')
        .select(
          `
          product_code,
          injection,
          pipeline,
          prebook,
          await,
          fold,
          bulk,
          await_grn,
          backcarpark,
          data_code!inner(
            description,
            colour,
            type
          )
        `,
          { count: 'exact' },
        )
        .order('product_code')
        .range(
          query.offset || 0,
          (query.offset || 0) + (query.limit || 50) - 1,
        );

      if (error) {
        console.error('Error fetching stock distribution:', error);
        throw error;
      }

      // Group by product code and aggregate the data
      const productMap = new Map<string, StockDistributionItemDto>();

      data?.forEach((item: any) => {
        const productCode = item.product_code;

        if (!productMap.has(productCode)) {
          productMap.set(productCode, {
            product_code: productCode,
            injection: 0,
            pipeline: 0,
            prebook: 0,
            await: 0,
            fold: 0,
            bulk: 0,
            await_grn: 0,
            backcarpark: 0,
            data_code: {
              description: item.data_code?.description,
              colour: item.data_code?.colour,
              type: item.data_code?.type,
            },
          });
        }

        const product = productMap.get(productCode);
        product.injection += item.injection || 0;
        product.pipeline += item.pipeline || 0;
        product.prebook += item.prebook || 0;
        product.await += item.await || 0;
        product.fold += item.fold || 0;
        product.bulk += item.bulk || 0;
        product.await_grn += item.await_grn || 0;
        product.backcarpark += item.backcarpark || 0;
      });

      // Convert to array and sort by total quantity
      const transformedData = Array.from(productMap.values()).sort((a, b) => {
        const totalA =
          (a.injection || 0) +
          (a.pipeline || 0) +
          (a.prebook || 0) +
          (a.await || 0) +
          (a.fold || 0) +
          (a.bulk || 0) +
          (a.await_grn || 0) +
          (a.backcarpark || 0);
        const totalB =
          (b.injection || 0) +
          (b.pipeline || 0) +
          (b.prebook || 0) +
          (b.await || 0) +
          (b.fold || 0) +
          (b.bulk || 0) +
          (b.await_grn || 0) +
          (b.backcarpark || 0);
        return totalB - totalA;
      });

      const calculationTime = Date.now() - startTime;

      const result: StockDistributionResponseDto = {
        data: transformedData,
        total: count || 0,
        offset: query.offset || 0,
        limit: query.limit || 50,
        metadata: {
          executed_at: new Date().toISOString(),
          calculation_time: `${calculationTime}ms`,
          cached: false,
        },
      };

      // Cache the result for 5 minutes
      this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Error fetching stock distribution:', error);
      return {
        data: [],
        total: 0,
        offset: query.offset || 0,
        limit: query.limit || 50,
        error: (error as Error).message,
      };
    }
  }

  private getDefaultLabel(dataSource: StatsCardDataSource): string {
    const labels = {
      [StatsCardDataSource.TOTAL_PALLETS]: 'Total Pallets',
      [StatsCardDataSource.TODAY_TRANSFERS]: "Today's Transfers",
      [StatsCardDataSource.ACTIVE_PRODUCTS]: 'Active Products',
      [StatsCardDataSource.PENDING_ORDERS]: 'Pending Orders',
      [StatsCardDataSource.AWAIT_PERCENTAGE_STATS]: 'Await Location %',
      [StatsCardDataSource.AWAIT_LOCATION_COUNT]: 'Await Location Count',
      [StatsCardDataSource.TRANSFER_COUNT]: 'Transfer Count',
      [StatsCardDataSource.PRODUCTION_STATS]: 'Production Stats',
      [StatsCardDataSource.UPDATE_STATS]: 'Update Required',
    };

    return labels[dataSource] || 'Unknown';
  }
}
