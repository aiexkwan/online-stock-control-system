// Department-specific card types

// DepartWareCard types
export interface DepartWareCardProps {
  className?: string;
  departmentId?: string;
  showStats?: boolean;
  refreshInterval?: number;
}

// DepartPipeCard types
export interface DepartPipeCardProps {
  className?: string;
  departmentId?: string;
  showInventory?: boolean;
  showProduction?: boolean;
}

// DepartInjCard types
export interface DepartInjCardProps {
  className?: string;
  departmentId?: string;
  showMachines?: boolean;
  showSchedule?: boolean;
}

// Keep Machine type as it might be referenced in DepartInjCard/DepartPipeCard
export interface Machine {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'idle' | 'maintenance' | 'error';
  currentJob?: string;
  efficiency: number;
  lastMaintenance?: string;
  nextMaintenance?: string;
  operator?: string;
}