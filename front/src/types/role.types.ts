// frontend/src/types/role.types.ts
export interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  domainId?: string | null;
  moduleId?: string | null;
}
