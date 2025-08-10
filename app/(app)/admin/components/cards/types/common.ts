// Common types actually used by card components

export interface UserInfo {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  avatar?: string;
}

export type FilterValue = string | number | boolean | Date | null;