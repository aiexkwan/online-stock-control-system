/**
 * Modern Dashboard Component
 * Glassmorphism Design Theme
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WidgetSize, WidgetType } from '@/app/types/dashboard';
import { cn } from '@/lib/utils';

// Import existing navigation
import { TabType } from '../navigation/SidebarNavigation';

// Terminal widget imports
import { ProductionReportWidget } from './widgets/ProductionReportWidget';
import { TargetHitReportWidget } from './widgets/TargetHitReportWidget';
import { ProductDoneHistoryWidget } from './widgets/ProductDoneHistoryWidget';
import { FinishedProductWidget } from './widgets/FinishedProductWidget';
import { MaterialReceivedWidget } from './widgets/MaterialReceivedWidget';
import { DatabaseUpdateWidget } from './widgets/DatabaseUpdateWidget';
import { DocumentUploadWidget } from './widgets/DocumentUploadWidget';
import { InventorySearchWidget } from './widgets/InventorySearchWidget';
import { AnalyticsDashboardWidget } from './widgets/AnalyticsDashboardWidget';

export function ModernDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('production');
  const [resourceMetrics, setResourceMetrics] = useState({
    cpu: 0,
    memory: 0,
    gpu: 0,
    network: 0
  });
  
  // Production stats data
  const stats = {
    production: {
      totalProduced: 1234,
      machineEfficiency: 84.2,
      targetHitRate: 94.5
    },
    warehouse: {
      totalTransferred: 856,
      bookOutRate: 92.3,
      targetHitRate: 88.7
    }
  };

  // Animate resource bars
  useEffect(() => {
    // Animate to target values when component mounts
    const timer = setTimeout(() => {
      setResourceMetrics({
        cpu: 34,
        memory: 68,
        gpu: 82,
        network: 45
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Inline styles for glassmorphism effect
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(14px) brightness(0.91)',
    WebkitBackdropFilter: 'blur(14px) brightness(0.91)',
  };

  const navItemStyle = (isActive: boolean) => ({
    ...glassStyle,
    borderLeft: '3px solid transparent',
    borderLeftColor: isActive ? '#3b82f6' : 'transparent',
    background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
  });

  const iconCircleStyle = {
    height: '2rem',
    width: '2rem',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)'
  };

  const cardDividerStyle = {
    height: '1px',
    backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.09) 20%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.09) 80%, transparent)'
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;600&family=Inter:wght@400;500&display=swap');
        
        h1, h2, h3, h4 {
          font-family: 'Manrope', sans-serif !important;
          font-weight: 200 !important;
          letter-spacing: -0.03em !important;
        }
      `}</style>

      {/* Top Header Bar */}
      <div 
        className="relative z-30 h-20 flex items-center justify-between px-8 border-b"
        style={{
          ...glassStyle,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-[200] tracking-[-0.03em] text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Stock Control System
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white/70">Live Dashboard</span>
          </div>
          <div style={iconCircleStyle}>
            <i className="fas fa-user text-white/60 text-sm"></i>
          </div>
        </div>
      </div>

      <div className="flex flex-1 relative z-10">
        {/* Left Sidebar Navigation */}
        <div 
          className="w-72 border-r"
          style={{
            ...glassStyle,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}
        >
          <nav className="p-6 space-y-3">
            {/* Production Nav Item */}
            <div
              className="p-4 rounded-xl cursor-pointer transition-all duration-300 hover:transform hover:translateX-1"
              style={navItemStyle(activeTab === 'production')}
              onClick={() => setActiveTab('production')}
            >
              <div className="flex items-center space-x-3">
                <div style={iconCircleStyle}>
                  <i className="fas fa-industry text-blue-400 text-xs"></i>
                </div>
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    activeTab === 'production' ? "text-white" : "text-white/80"
                  )}>
                    Production
                  </span>
                  <p className="text-xs text-white/60 mt-0.5">Manufacturing data</p>
                </div>
              </div>
            </div>

            {/* Warehouse Nav Item */}
            <div
              className="p-4 rounded-xl cursor-pointer transition-all duration-300 hover:transform hover:translateX-1"
              style={navItemStyle(activeTab === 'warehouse')}
              onClick={() => setActiveTab('warehouse')}
            >
              <div className="flex items-center space-x-3">
                <div style={iconCircleStyle}>
                  <i className="fas fa-warehouse text-blue-400 text-xs"></i>
                </div>
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    activeTab === 'warehouse' ? "text-white" : "text-white/80"
                  )}>
                    Warehouse
                  </span>
                  <p className="text-xs text-white/60 mt-0.5">Inventory tracking</p>
                </div>
              </div>
            </div>

            {/* Inventory Nav Item */}
            <div
              className="p-4 rounded-xl cursor-pointer transition-all duration-300 hover:transform hover:translateX-1"
              style={navItemStyle(activeTab === 'inventory')}
              onClick={() => setActiveTab('inventory')}
            >
              <div className="flex items-center space-x-3">
                <div style={iconCircleStyle}>
                  <i className="fas fa-boxes text-blue-400 text-xs"></i>
                </div>
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    activeTab === 'inventory' ? "text-white" : "text-white/80"
                  )}>
                    Inventory
                  </span>
                  <p className="text-xs text-white/60 mt-0.5">Stock levels</p>
                </div>
              </div>
            </div>

            {/* Updates/Upload Nav Item */}
            <div
              className="p-4 rounded-xl cursor-pointer transition-all duration-300 hover:transform hover:translateX-1"
              style={navItemStyle(activeTab === 'update')}
              onClick={() => setActiveTab('update')}
            >
              <div className="flex items-center space-x-3">
                <div style={iconCircleStyle}>
                  <i className="fas fa-sync text-blue-400 text-xs"></i>
                </div>
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    activeTab === 'update' ? "text-white" : "text-white/80"
                  )}>
                    Updates/Upload
                  </span>
                  <p className="text-xs text-white/60 mt-0.5">Data sync</p>
                </div>
              </div>
            </div>

            {/* Search Nav Item */}
            <div
              className="p-4 rounded-xl cursor-pointer transition-all duration-300 hover:transform hover:translateX-1"
              style={navItemStyle(activeTab === 'search')}
              onClick={() => setActiveTab('search')}
            >
              <div className="flex items-center space-x-3">
                <div style={iconCircleStyle}>
                  <i className="fas fa-search text-blue-400 text-xs"></i>
                </div>
                <div>
                  <span className={cn(
                    "font-medium text-sm",
                    activeTab === 'search' ? "text-white" : "text-white/80"
                  )}>
                    Search
                  </span>
                  <p className="text-xs text-white/60 mt-0.5">Find records</p>
                </div>
              </div>
            </div>
          </nav>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Production Tab */}
              {activeTab === 'production' && (
                <motion.div
                  key="production"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className="mb-10">
                    <h1 className="text-4xl font-[200] tracking-[-0.03em] text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Production Dashboard
                    </h1>
                    <p className="text-white/70 text-lg">Monitor manufacturing and production metrics in real-time</p>
                  </div>

                  {/* Stat Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    <div 
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div style={iconCircleStyle}>
                          <i className="fas fa-cube text-blue-400 text-xs"></i>
                        </div>
                        <h3 className="ml-3 text-lg text-white font-medium">Total Produced</h3>
                      </div>
                      <div className="mt-2">
                        <div className="text-3xl font-[200] text-white mb-1">{stats.production.totalProduced}</div>
                        <p className="text-white/60 text-sm">Today&apos;s output</p>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <i className="fas fa-arrow-up text-green-400 mr-2"></i>
                        <span className="text-green-400">20.1%</span>
                        <span className="text-white/50 ml-2">vs yesterday</span>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div style={iconCircleStyle}>
                          <i className="fas fa-cog text-blue-400 text-xs"></i>
                        </div>
                        <h3 className="ml-3 text-lg text-white font-medium">Machine Efficiency</h3>
                      </div>
                      <div className="mt-2">
                        <div className="text-3xl font-[200] text-white mb-1">{stats.production.machineEfficiency}%</div>
                        <p className="text-white/60 text-sm">Average today</p>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <i className="fas fa-arrow-down text-red-400 mr-2"></i>
                        <span className="text-red-400">2.3%</span>
                        <span className="text-white/50 ml-2">vs yesterday</span>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div style={iconCircleStyle}>
                          <i className="fas fa-chart-bar text-blue-400 text-xs"></i>
                        </div>
                        <h3 className="ml-3 text-lg text-white font-medium">Target Hit Rate</h3>
                      </div>
                      <div className="mt-2">
                        <div className="text-3xl font-[200] text-white mb-1">{stats.production.targetHitRate}%</div>
                        <p className="text-white/60 text-sm">Weekly average</p>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <i className="fas fa-arrow-up text-green-400 mr-2"></i>
                        <span className="text-green-400">3.2%</span>
                        <span className="text-white/50 ml-2">vs yesterday</span>
                      </div>
                    </div>
                  </div>

                  {/* Production Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.3)'}}>
                            <i className="fas fa-chart-line text-blue-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Production Report</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <ProductionReportWidget
                            widget={{
                              id: 'prod-chart-today',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 0, y: 2, w: 5, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(99, 102, 241, 0.2)', borderColor: 'rgba(99, 102, 241, 0.3)'}}>
                            <i className="fas fa-bullseye text-indigo-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Target Hit Rate</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <TargetHitReportWidget
                            widget={{
                              id: 'prod-chart-efficiency',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 6, y: 2, w: 5, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.3)'}}>
                            <i className="fas fa-history text-purple-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Production History</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <ProductDoneHistoryWidget
                            widget={{
                              id: 'prod-history',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 12, y: 2, w: 5, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Warehouse Tab */}
              {activeTab === 'warehouse' && (
                <motion.div
                  key="warehouse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-10">
                    <h1 className="text-4xl font-[200] tracking-[-0.03em] text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Warehouse Dashboard
                    </h1>
                    <p className="text-white/70 text-lg">Monitor warehouse and inventory operations</p>
                  </div>
                  
                  {/* Warehouse Stat Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div 
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div style={iconCircleStyle}>
                          <i className="fas fa-truck text-blue-400 text-xs"></i>
                        </div>
                        <h3 className="ml-3 text-lg text-white font-medium">Total Transferred</h3>
                      </div>
                      <div className="mt-2">
                        <div className="text-3xl font-[200] text-white mb-1">{stats.warehouse.totalTransferred}</div>
                        <p className="text-white/60 text-sm">Today&apos;s transfers</p>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <i className="fas fa-arrow-up text-green-400 mr-2"></i>
                        <span className="text-green-400">15.3%</span>
                        <span className="text-white/50 ml-2">vs yesterday</span>
                      </div>
                    </div>
                    
                    <div 
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div style={iconCircleStyle}>
                          <i className="fas fa-chart-bar text-blue-400 text-xs"></i>
                        </div>
                        <h3 className="ml-3 text-lg text-white font-medium">Book Out Rate</h3>
                      </div>
                      <div className="mt-2">
                        <div className="text-3xl font-[200] text-white mb-1">{stats.warehouse.bookOutRate}%</div>
                        <p className="text-white/60 text-sm">Success rate</p>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <i className="fas fa-arrow-down text-red-400 mr-2"></i>
                        <span className="text-red-400">4.2%</span>
                        <span className="text-white/50 ml-2">vs yesterday</span>
                      </div>
                    </div>
                    
                    <div 
                      className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="flex items-center mb-4">
                        <div style={iconCircleStyle}>
                          <i className="fas fa-chart-pie text-blue-400 text-xs"></i>
                        </div>
                        <h3 className="ml-3 text-lg text-white font-medium">Target Hit Rate</h3>
                      </div>
                      <div className="mt-2">
                        <div className="text-3xl font-[200] text-white mb-1">{stats.warehouse.targetHitRate}%</div>
                        <p className="text-white/60 text-sm">Weekly average</p>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <i className="fas fa-arrow-up text-green-400 mr-2"></i>
                        <span className="text-green-400">1.8%</span>
                        <span className="text-white/50 ml-2">vs yesterday</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Inventory Tab */}
              {activeTab === 'inventory' && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-10">
                    <h1 className="text-4xl font-[200] tracking-[-0.03em] text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Inventory Management
                    </h1>
                    <p className="text-white/70 text-lg">Track and manage stock levels across all locations</p>
                  </div>
                  
                  {/* Inventory Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.3)'}}>
                            <i className="fas fa-boxes text-green-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Finished Products</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <FinishedProductWidget
                            widget={{
                              id: 'finished-products',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 0, y: 0, w: 6, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(251, 146, 60, 0.2)', borderColor: 'rgba(251, 146, 60, 0.3)'}}>
                            <i className="fas fa-truck-loading text-orange-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Material Received</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <MaterialReceivedWidget
                            widget={{
                              id: 'material-received',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 6, y: 0, w: 6, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Updates/Upload Tab */}
              {activeTab === 'update' && (
                <motion.div
                  key="updates"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-10">
                    <h1 className="text-4xl font-[200] tracking-[-0.03em] text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Data Updates & Upload
                    </h1>
                    <p className="text-white/70 text-lg">Sync database and upload documents</p>
                  </div>
                  
                  {/* Updates Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(6, 182, 212, 0.2)', borderColor: 'rgba(6, 182, 212, 0.3)'}}>
                            <i className="fas fa-database text-cyan-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Database Update</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <DatabaseUpdateWidget
                            widget={{
                              id: 'database-update',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 0, y: 0, w: 6, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(236, 72, 153, 0.2)', borderColor: 'rgba(236, 72, 153, 0.3)'}}>
                            <i className="fas fa-file-upload text-pink-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Document Upload</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <DocumentUploadWidget
                            widget={{
                              id: 'document-upload',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 6, y: 0, w: 6, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Search Tab */}
              {activeTab === 'search' && (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-10">
                    <h1 className="text-4xl font-[200] tracking-[-0.03em] text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Search & Analytics
                    </h1>
                    <p className="text-white/70 text-lg">Find products and analyze inventory data</p>
                  </div>
                  
                  {/* Search Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(139, 92, 246, 0.2)', borderColor: 'rgba(139, 92, 246, 0.3)'}}>
                            <i className="fas fa-search text-violet-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Inventory Search</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <InventorySearchWidget
                            widget={{
                              id: 'inventory-search',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 0, y: 0, w: 6, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>

                    <div 
                      className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                      style={{
                        ...glassStyle,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div className="h-[400px] flex flex-col">
                        <div className="flex items-center mb-4">
                          <div style={{...iconCircleStyle, background: 'rgba(20, 184, 166, 0.2)', borderColor: 'rgba(20, 184, 166, 0.3)'}}>
                            <i className="fas fa-chart-line text-teal-400 text-xs"></i>
                          </div>
                          <h3 className="ml-3 text-lg text-white font-medium">Analytics Dashboard</h3>
                        </div>
                        <div style={cardDividerStyle} className="w-full mb-4"></div>
                        <div className="flex-1 min-h-0">
                          <AnalyticsDashboardWidget
                            widget={{
                              id: 'analytics-dashboard',
                              type: WidgetType.CUSTOM,
                              gridProps: { x: 6, y: 0, w: 6, h: 5 },
                              config: { size: WidgetSize.LARGE }
                            }}
                            isEditMode={false}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}