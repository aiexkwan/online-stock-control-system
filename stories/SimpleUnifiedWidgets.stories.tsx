import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Box, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

// Simplified mock components for Storybook demonstration
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className='border-b border-gray-100 px-6 py-4'>{children}</div>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className='px-6 py-4'>{children}</div>
);

const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;

// Simple Stats Widget Component
interface SimpleStatsWidgetProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  error?: string;
}

const SimpleStatsWidget: React.FC<SimpleStatsWidgetProps> = ({
  title,
  value,
  description,
  icon: Icon = Box,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <Card className='h-32 w-80'>
        <CardHeader>
          <div className='h-4 w-24 animate-pulse rounded bg-gray-200'></div>
        </CardHeader>
        <CardContent>
          <div className='mb-2 h-8 w-16 animate-pulse rounded bg-gray-200'></div>
          <div className='h-3 w-32 animate-pulse rounded bg-gray-200'></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='h-32 w-80 border-red-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <AlertTriangle className='h-5 w-5' />
            Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-500'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-32 w-80'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon className='h-5 w-5 text-blue-500' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='mb-1 text-2xl font-bold text-gray-900'>{value}</div>
        {description && <p className='text-sm text-gray-600'>{description}</p>}
      </CardContent>
    </Card>
  );
};

// Simple Chart Widget Component
interface SimpleChartWidgetProps {
  title: string;
  chartType: 'bar' | 'line' | 'pie';
  data: Array<{ name: string; value: number }>;
  loading?: boolean;
  error?: string;
}

const SimpleChartWidget: React.FC<SimpleChartWidgetProps> = ({
  title,
  chartType,
  data,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <Card className='h-64 w-96'>
        <CardHeader>
          <div className='h-4 w-32 animate-pulse rounded bg-gray-200'></div>
        </CardHeader>
        <CardContent>
          <div className='h-40 animate-pulse rounded bg-gray-200'></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='h-64 w-96 border-red-200'>
        <CardHeader>
          <CardTitle className='text-red-600'>Chart Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-500'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card className='h-64 w-96'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {chartType === 'bar' &&
            data.map((item, index) => (
              <div key={index} className='flex items-center gap-2'>
                <span className='w-16 truncate text-sm'>{item.name}</span>
                <div className='h-4 flex-1 rounded bg-gray-200'>
                  <div
                    className='h-4 rounded bg-blue-500'
                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                  ></div>
                </div>
                <span className='w-8 text-right text-sm'>{item.value}</span>
              </div>
            ))}
          {chartType === 'pie' && (
            <div className='text-center text-sm text-gray-600'>
              Pie Chart Visualization ({data.length} segments)
            </div>
          )}
          {chartType === 'line' && (
            <div className='text-center text-sm text-gray-600'>
              Line Chart Visualization ({data.length} data points)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Simple Table Widget Component
interface SimpleTableWidgetProps {
  title: string;
  data: Array<Record<string, any>>;
  loading?: boolean;
  error?: string;
}

const SimpleTableWidget: React.FC<SimpleTableWidgetProps> = ({
  title,
  data,
  loading = false,
  error,
}) => {
  if (loading) {
    return (
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <div className='h-4 w-32 animate-pulse rounded bg-gray-200'></div>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <div className='h-8 animate-pulse rounded bg-gray-200'></div>
            <div className='h-6 animate-pulse rounded bg-gray-100'></div>
            <div className='h-6 animate-pulse rounded bg-gray-100'></div>
            <div className='h-6 animate-pulse rounded bg-gray-100'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='w-full max-w-2xl border-red-200'>
        <CardHeader>
          <CardTitle className='text-red-600'>Table Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-red-500'>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='py-8 text-center text-gray-500'>No data available</p>
        </CardContent>
      </Card>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                {columns.map(col => (
                  <th key={col} className='p-2 text-left font-medium capitalize'>
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((row, index) => (
                <tr key={index} className='border-b'>
                  {columns.map(col => (
                    <td key={col} className='p-2'>
                      {typeof row[col] === 'boolean'
                        ? row[col]
                          ? 'Yes'
                          : 'No'
                        : row[col]?.toString().length > 30
                          ? `${row[col]?.toString().substring(0, 30)}...`
                          : row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 5 && (
            <div className='mt-2 text-center text-xs text-gray-500'>
              Showing 5 of {data.length} records
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Mock data
const mockStatsData = {
  success: { value: 1234, description: 'Total pallets produced today' },
  loading: { value: 'Loading...', description: 'Fetching data...' },
  error: { value: 'Error', description: 'Failed to load data' },
};

const mockChartData = {
  production: [
    { name: 'Mon', value: 120 },
    { name: 'Tue', value: 132 },
    { name: 'Wed', value: 101 },
    { name: 'Thu', value: 134 },
    { name: 'Fri', value: 90 },
  ],
  departments: [
    { name: 'Production', value: 45 },
    { name: 'QC', value: 30 },
    { name: 'Packaging', value: 25 },
  ],
};

const mockTableData = [
  { id: 'ORD-001', customer: 'Customer A', status: 'Pending', items: 5, amount: 1250 },
  { id: 'ORD-002', customer: 'Customer B', status: 'Processing', items: 12, amount: 3400 },
  { id: 'ORD-003', customer: 'Customer C', status: 'Shipped', items: 8, amount: 2100 },
  { id: 'ORD-004', customer: 'Customer D', status: 'Delivered', items: 15, amount: 4800 },
];

// Stories
const meta = {
  title: 'Dashboard/Unified Widgets Demo',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#333333' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Stats Widget Stories
export const StatsDefault: Story = {
  render: () => (
    <SimpleStatsWidget
      title='Production Today'
      value={mockStatsData.success.value}
      description={mockStatsData.success.description}
      icon={Box}
    />
  ),
};

export const StatsEfficiency: Story = {
  render: () => (
    <SimpleStatsWidget
      title='Production Efficiency'
      value='87.6%'
      description='Current efficiency rate'
      icon={TrendingUp}
    />
  ),
};

export const StatsLoading: Story = {
  render: () => <SimpleStatsWidget title='Production Today' value={0} loading={true} />,
};

export const StatsError: Story = {
  render: () => (
    <SimpleStatsWidget title='Production Today' value={0} error='Failed to load production data' />
  ),
};

// Chart Widget Stories
export const ChartBarDefault: Story = {
  render: () => (
    <SimpleChartWidget title='Weekly Production' chartType='bar' data={mockChartData.production} />
  ),
};

export const ChartPieDistribution: Story = {
  render: () => (
    <SimpleChartWidget
      title='Department Distribution'
      chartType='pie'
      data={mockChartData.departments}
    />
  ),
};

export const ChartLoading: Story = {
  render: () => (
    <SimpleChartWidget title='Weekly Production' chartType='bar' data={[]} loading={true} />
  ),
};

export const ChartError: Story = {
  render: () => (
    <SimpleChartWidget
      title='Weekly Production'
      chartType='bar'
      data={[]}
      error='Failed to load chart data'
    />
  ),
};

// Table Widget Stories
export const TableDefault: Story = {
  render: () => <SimpleTableWidget title='Recent Orders' data={mockTableData} />,
};

export const TableEmpty: Story = {
  render: () => <SimpleTableWidget title='Recent Orders' data={[]} />,
};

export const TableLoading: Story = {
  render: () => <SimpleTableWidget title='Recent Orders' data={[]} loading={true} />,
};

export const TableError: Story = {
  render: () => (
    <SimpleTableWidget title='Recent Orders' data={[]} error='Failed to load table data' />
  ),
};

// Combined Layout Story
export const AllWidgetsCombined: Story = {
  render: () => (
    <div className='grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-2'>
      <div className='space-y-4'>
        <SimpleStatsWidget
          title='Production Today'
          value={1234}
          description='Total pallets produced'
          icon={Box}
        />
        <SimpleStatsWidget
          title='Efficiency Rate'
          value='87.6%'
          description='Current efficiency'
          icon={TrendingUp}
        />
      </div>
      <div className='space-y-4'>
        <SimpleChartWidget
          title='Weekly Production'
          chartType='bar'
          data={mockChartData.production}
        />
      </div>
      <div className='lg:col-span-2'>
        <SimpleTableWidget title='Recent Orders' data={mockTableData} />
      </div>
    </div>
  ),
};
