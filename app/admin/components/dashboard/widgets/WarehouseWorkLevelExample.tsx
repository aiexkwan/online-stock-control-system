'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { RefreshCw, TrendingUp, Users, Calendar, Activity } from 'lucide-react'
import { useWarehouseWorkLevel } from '@/app/hooks/useWarehouseWorkLevel'
import { transformToChartData, extractSummaryStats } from '@/app/types/warehouse-work-level'
import { format } from 'date-fns'

interface WarehouseWorkLevelExampleProps {
  className?: string
}

export function WarehouseWorkLevelExample({ className }: WarehouseWorkLevelExampleProps) {
  const [dateRange, setDateRange] = React.useState('7days')
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const end = new Date()
    const start = new Date()
    
    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case '7days':
        start.setDate(start.getDate() - 7)
        break
      case '30days':
        start.setDate(start.getDate() - 30)
        break
      case 'thisMonth':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      default:
        start.setDate(start.getDate() - 7)
    }
    
    return { startDate: start, endDate: end }
  }

  const { data, loading, error, refetch, isRefreshing } = useWarehouseWorkLevel(
    getDateRange(),
    {
      autoFetch: true,
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      onError: (err) => {
        console.error('Failed to fetch warehouse work level:', err)
      }
    }
  )

  // Handle date range change
  React.useEffect(() => {
    refetch(getDateRange())
  }, [dateRange, refetch])

  if (loading && !data) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading warehouse data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-destructive">Failed to load data</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  const chartData = transformToChartData(data)
  const summaryStats = extractSummaryStats(data)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Warehouse Work Level</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => refetch()}
              size="icon"
              variant="outline"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Moves</p>
            </div>
            <p className="text-2xl font-semibold">{summaryStats.totalMoves.toLocaleString()}</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Operators</p>
            </div>
            <p className="text-2xl font-semibold">{summaryStats.uniqueOperators}</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Daily Average</p>
            </div>
            <p className="text-2xl font-semibold">{Math.round(summaryStats.avgMovesPerDay).toLocaleString()}</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Peak Day</p>
            </div>
            {summaryStats.peakDay ? (
              <div>
                <p className="text-lg font-semibold">{summaryStats.peakDay.moves.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(summaryStats.peakDay.date), 'dd MMM')}
                </p>
              </div>
            ) : (
              <p className="text-lg font-semibold">-</p>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoves" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOperators" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="moves"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorMoves)"
                  name="Total Moves"
                />
                <Area
                  type="monotone"
                  dataKey="operators"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorOperators)"
                  name="Active Operators"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>No data available for the selected period</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <p>Last updated: {format(new Date(data.metadata.executed_at), 'dd MMM yyyy HH:mm:ss')}</p>
          <p>Query time: {data.calculation_time}</p>
        </div>
      </CardContent>
    </Card>
  )
}