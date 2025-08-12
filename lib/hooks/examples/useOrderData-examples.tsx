/**
 * useOrderData Hook Usage Examples
 * Demonstrates how to integrate the order data hooks with Card components
 */

import React, { useState, useCallback } from 'react';
import { 
  useOrderData, 
  useWarehouseOrders, 
  useWarehouseOrder, 
  useAcoOrderReport, 
  useOrderLoadingRecords,
  WarehouseOrderFilterInput,
  OrderLoadingFilterInput 
} from '../useOrderData';
import { WarehouseOrderStatus } from '../types/orderData.types';

/**
 * Example 1: Complete Order Management Card
 */
export function OrderManagementCard() {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [filter, setFilter] = useState<WarehouseOrderFilterInput>({});

  // Use the main hook with all features enabled
  const orderData = useOrderData({
    polling: 30000, // Poll every 30 seconds
    subscriptions: true, // Enable real-time updates
    optimisticUpdates: true, // Enable optimistic UI updates
    fetchPolicy: 'cache-and-network',
    pagination: { limit: 20 }
  });

  const handleStatusUpdate = useCallback(async (orderId: string, status: WarehouseOrderStatus) => {
    const success = await orderData.updateOrderStatus({ orderId, status });
    if (success) {
      console.log('Order status updated successfully');
      // Optionally refetch data
      await orderData.refetchOrders();
    }
  }, [orderData]);

  const handleFilterChange = useCallback((newFilter: WarehouseOrderFilterInput) => {
    setFilter(newFilter);
    orderData.setFilter(newFilter);
  }, [orderData]);

  return (
    <div className="order-management-card">
      <h2>Order Management</h2>
      
      {/* Filter Controls */}
      <div className="filters">
        <input
          type="text"
          placeholder="Order Reference"
          onChange={(e) => handleFilterChange({ ...filter, orderRef: e.target.value })}
        />
        <select 
          onChange={(e) => handleFilterChange({ ...filter, status: e.target.value as WarehouseOrderStatus })}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Loading State */}
      {orderData.loading && <div>Loading orders...</div>}
      
      {/* Error State */}
      {orderData.error && (
        <div className="error">
          Error: {orderData.error.message}
        </div>
      )}

      {/* Orders List */}
      <div className="orders-list">
        {orderData.warehouseOrders.map((order) => (
          <div 
            key={order.id} 
            className="order-item"
            onClick={() => setSelectedOrderId(order.id)}
          >
            <h3>{order.orderRef}</h3>
            <p>Customer: {order.customerName}</p>
            <p>Status: {order.status}</p>
            <p>Progress: {order.loadedQuantity}/{order.totalQuantity}</p>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusUpdate(order.id, 'COMPLETED');
              }}
            >
              Mark Complete
            </button>
          </div>
        ))}
      </div>

      {/* Aggregates */}
      {orderData.warehouseOrdersAggregates && (
        <div className="aggregates">
          <p>Total Orders: {orderData.warehouseOrdersAggregates.totalOrders}</p>
          <p>Pending: {orderData.warehouseOrdersAggregates.pendingOrders}</p>
          <p>Completed: {orderData.warehouseOrdersAggregates.completedOrders}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Simple Warehouse Orders List Card
 */
export function WarehouseOrdersListCard() {
  const [filter, setFilter] = useState<WarehouseOrderFilterInput>({
    status: 'PENDING'
  });

  // Use the specialized hook for warehouse orders only
  const { orders, total, loading, error, setFilter: updateFilter } = useWarehouseOrders(filter, {
    fetchPolicy: 'cache-first',
    polling: 60000 // Poll every minute
  });

  return (
    <div className="warehouse-orders-card">
      <h2>Pending Warehouse Orders ({total})</h2>
      
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      
      <div className="orders-grid">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <h3>{order.orderRef}</h3>
            <p>{order.customerName}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${(order.loadedQuantity / order.totalQuantity) * 100}%` 
                }}
              />
            </div>
            <p>{order.loadedQuantity} / {order.totalQuantity}</p>
          </div>
        ))}
      </div>
      
      <button onClick={() => updateFilter({ ...filter, status: 'IN_PROGRESS' })}>
        Show In Progress
      </button>
    </div>
  );
}

/**
 * Example 3: Single Order Detail Card
 */
export function OrderDetailCard({ orderId }: { orderId: string }) {
  // Use the specialized hook for single order
  const { order, loading, error, refetch } = useWarehouseOrder(orderId, undefined, {
    fetchPolicy: 'cache-and-network'
  });

  if (loading) return <div>Loading order details...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="order-detail-card">
      <div className="header">
        <h2>Order {order.orderRef}</h2>
        <button onClick={() => refetch()}>Refresh</button>
      </div>
      
      <div className="order-info">
        <p><strong>Customer:</strong> {order.customerName}</p>
        <p><strong>Status:</strong> {order.status}</p>
        <p><strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
        {order.completedAt && (
          <p><strong>Completed:</strong> {new Date(order.completedAt).toLocaleDateString()}</p>
        )}
      </div>

      <div className="order-items">
        <h3>Items</h3>
        {order.items.map((item) => (
          <div key={item.id} className="item-row">
            <span>{item.productCode}</span>
            <span>{item.productDesc}</span>
            <span>{item.loadedQuantity} / {item.quantity}</span>
            <span className={`status ${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
      
      <div className="order-summary">
        <p>Total Progress: {order.loadedQuantity} / {order.totalQuantity}</p>
        <p>Remaining: {order.remainingQuantity}</p>
      </div>
    </div>
  );
}

/**
 * Example 4: ACO Order Report Card
 */
export function AcoOrderReportCard() {
  const [reference, setReference] = useState<string>('');
  const { report, total, loading, error, refetch } = useAcoOrderReport(reference, {
    fetchPolicy: 'no-cache' // Always fetch fresh data for reports
  });

  const handleGenerateReport = useCallback(() => {
    if (reference) {
      refetch(reference);
    }
  }, [reference, refetch]);

  return (
    <div className="aco-order-report-card">
      <h2>ACO Order Report</h2>
      
      <div className="report-controls">
        <input
          type="text"
          placeholder="Order Reference"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <button onClick={handleGenerateReport} disabled={!reference || loading}>
          Generate Report
        </button>
      </div>

      {loading && <div>Generating report...</div>}
      {error && <div>Error: {error.message}</div>}

      {report.length > 0 && (
        <div className="report-results">
          <h3>Report Results ({total} items)</h3>
          <div className="report-table">
            {report.map((item, index) => (
              <div key={index} className="report-row">
                <span>{item.productCode}</span>
                <span>{item.productDesc}</span>
                <span>{item.quantityOrdered}</span>
                <span>{item.quantityUsed}</span>
                <span>{item.remainingQuantity}</span>
                <span className={`status ${item.completionStatus.toLowerCase()}`}>
                  {item.completionStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Order Loading Records Card
 */
export function OrderLoadingRecordsCard() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const filter: OrderLoadingFilterInput = {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  };

  const { records, total, summary, loading, error, refetch } = useOrderLoadingRecords(filter, {
    fetchPolicy: 'cache-and-network'
  });

  return (
    <div className="loading-records-card">
      <h2>Order Loading Records</h2>
      
      <div className="date-filter">
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        />
        <button onClick={() => refetch(filter)}>Refresh</button>
      </div>

      {loading && <div>Loading records...</div>}
      {error && <div>Error: {error.message}</div>}

      {summary && (
        <div className="summary">
          <div className="summary-item">
            <h4>Total Loaded</h4>
            <span>{summary.totalLoaded}</span>
          </div>
          <div className="summary-item">
            <h4>Unique Orders</h4>
            <span>{summary.uniqueOrders}</span>
          </div>
          <div className="summary-item">
            <h4>Unique Products</h4>
            <span>{summary.uniqueProducts}</span>
          </div>
          <div className="summary-item">
            <h4>Avg Load/Order</h4>
            <span>{summary.averageLoadPerOrder.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="records-list">
        <h3>Records ({total})</h3>
        {records.map((record, index) => (
          <div key={index} className="record-item">
            <span>{new Date(record.timestamp).toLocaleString()}</span>
            <span>{record.orderNumber}</span>
            <span>{record.productCode}</span>
            <span>{record.loadedQty}</span>
            <span>{record.userName}</span>
            <span>{record.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 6: Order Management with Mutations
 */
export function OrderMutationsCard() {
  const orderData = useOrderData({
    optimisticUpdates: true,
    subscriptions: true
  });

  const handleUpdateAcoOrder = async () => {
    const success = await orderData.updateAcoOrder({
      input: {
        orderRef: 12345,
        productCode: 'ABC123',
        quantityUsed: 100,
        orderCompleted: false
      }
    });
    
    if (success) {
      console.log('ACO order updated successfully');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const success = await orderData.cancelOrder({
      orderId,
      reason: 'Customer request'
    });
    
    if (success) {
      console.log('Order cancelled successfully');
      await orderData.refetchOrders();
    }
  };

  return (
    <div className="order-mutations-card">
      <h2>Order Actions</h2>
      
      <div className="actions">
        <button 
          onClick={handleUpdateAcoOrder}
          disabled={orderData.loading}
        >
          Update ACO Order
        </button>
        
        <button 
          onClick={() => handleCancelOrder('order-123')}
          disabled={orderData.loading}
        >
          Cancel Order
        </button>
        
        <button 
          onClick={orderData.refetchAll}
          disabled={orderData.loading}
        >
          Refresh All Data
        </button>
      </div>
      
      {orderData.loading && <div>Processing...</div>}
      {orderData.error && <div>Error: {orderData.error.message}</div>}
    </div>
  );
}

/**
 * CSS Styles for Examples (add to your CSS file)
 */
export const exampleStyles = `
.order-management-card,
.warehouse-orders-card,
.order-detail-card,
.aco-order-report-card,
.loading-records-card,
.order-mutations-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.orders-list,
.orders-grid {
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
}

.orders-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.order-item,
.order-card {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
}

.order-item:hover,
.order-card:hover {
  background-color: #f9fafb;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.progress-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.error {
  color: #ef4444;
  padding: 0.5rem;
  background-color: #fee2e2;
  border-radius: 4px;
  margin: 1rem 0;
}

.status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status.pending { background-color: #fbbf24; color: #000; }
.status.in_progress { background-color: #3b82f6; color: #fff; }
.status.completed { background-color: #10b981; color: #fff; }
.status.partial { background-color: #f59e0b; color: #000; }

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.summary-item {
  text-align: center;
  padding: 1rem;
  background-color: #f3f4f6;
  border-radius: 4px;
}

.summary-item h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-item span {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.actions {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2563eb;
}

button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.date-filter {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.report-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.report-table,
.records-list {
  max-height: 400px;
  overflow-y: auto;
}

.report-row,
.record-item {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 1fr;
  gap: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}
`;