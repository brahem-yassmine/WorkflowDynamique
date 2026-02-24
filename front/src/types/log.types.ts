export type UserRole = 'super_admin' | 'tenant_admin';

export type ActionType = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED' 
  | 'LOGOUT' 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'IMPORT' 
  | 'PASSWORD_CHANGE' 
  | 'PASSWORD_RESET' 
  | 'STATUS_CHANGE' 
  | 'PERMISSION_CHANGE' 
  | 'CONFIGURATION_CHANGE' 
  | 'BACKUP_CREATED' 
  | 'BACKUP_RESTORED' 
  | 'ERROR';

export type EntityType = 'TENANT' | 'USER' | 'PLAN' | 'SETTINGS' | 'DATABASE' | 'BACKUP' | 'LOGIN' | 'OTHER';
export type StatusType = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface ILog {
  _id: string;
  userId: string | null;
  userModel: 'SuperAdmin' | 'Tenant' | null;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string | null;
  entityName: string;
  description: string;
  details: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  status: StatusType;
  errorMessage?: string;
  errorStack?: string;
  timestamp: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  tenantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LogFilters {
  userEmail: string;
  actionType: ActionType | '';
  entityType: EntityType | '';
  status: StatusType | '';
  startDate: Date | null;
  endDate: Date | null;
  search: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
}

export interface LogsResponse {
  success: boolean;
  data: {
    logs: ILog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface LogStats {
  byActionType: Array<{ _id: ActionType; count: number }>;
  byUserRole: Array<{ _id: UserRole; count: number }>;
  byStatus: Array<{ _id: StatusType; count: number }>;
  byHour: Array<{ _id: number; count: number }>;
  totalLogs: Array<{ total: number }>;
}