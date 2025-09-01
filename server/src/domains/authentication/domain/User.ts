import { UserRole } from './UserRole';

export interface User {
  id: string;
  storeId: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  storeId: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: string[];
  createdBy: string;
}

export interface UpdateUserRequest {
  username?: string;
  role?: UserRole;
  permissions?: string[];
  isActive?: boolean;
}

export class UserEntity implements User {
  constructor(
    public readonly id: string,
    public readonly storeId: string,
    public readonly username: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly permissions: string[],
    public readonly isActive: boolean,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(request: CreateUserRequest, hashedPassword: string): UserEntity {
    // Business rule validations
    this.validateUsername(request.username);
    this.validateEmail(request.email);
    this.validatePassword(request.password);
    this.validateStoreId(request.storeId);
    this.validateCreatedBy(request.createdBy);
    this.validateRole(request.role);
    this.validatePermissions(request.permissions, request.role);

    const now = new Date();
    const id = this.generateId();

    return new UserEntity(
      id,
      request.storeId,
      request.username.trim(),
      request.email.toLowerCase().trim(),
      hashedPassword,
      request.role,
      request.permissions,
      true, // New users are active by default
      request.createdBy,
      now,
      now
    );
  }

  update(request: UpdateUserRequest): UserEntity {
    if (request.username !== undefined) {
      UserEntity.validateUsername(request.username);
    }
    if (request.role !== undefined) {
      UserEntity.validateRole(request.role);
    }
    if (request.permissions !== undefined) {
      UserEntity.validatePermissions(request.permissions, request.role ?? this.role);
    }

    return new UserEntity(
      this.id,
      this.storeId, // Store cannot be changed
      request.username?.trim() ?? this.username,
      this.email, // Email cannot be updated
      this.passwordHash, // Password updated separately
      request.role ?? this.role,
      request.permissions ?? this.permissions,
      request.isActive ?? this.isActive,
      this.createdBy, // Creator cannot be changed
      this.createdAt,
      new Date()
    );
  }

  changePassword(newHashedPassword: string): UserEntity {
    return new UserEntity(
      this.id,
      this.storeId,
      this.username,
      this.email,
      newHashedPassword,
      this.role,
      this.permissions,
      this.isActive,
      this.createdBy,
      this.createdAt,
      new Date()
    );
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isManager(): boolean {
    return this.role === UserRole.MANAGER || this.role === UserRole.ADMIN;
  }

  isCashier(): boolean {
    return this.role === UserRole.CASHIER;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  private static validateUsername(username: string): void {
    if (!username || username.trim().length === 0) {
      throw new Error('Username is required');
    }
    if (username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (username.trim().length > 50) {
      throw new Error('Username cannot exceed 50 characters');
    }
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  private static validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Invalid email format');
    }
  }

  private static validatePassword(password: string): void {
    if (!password || password.length === 0) {
      throw new Error('Password is required');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (password.length > 100) {
      throw new Error('Password cannot exceed 100 characters');
    }
    // At least one uppercase, one lowercase, one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
  }

  private static validateStoreId(storeId: string): void {
    if (!storeId || storeId.trim().length === 0) {
      throw new Error('Store ID is required');
    }
  }

  private static validateCreatedBy(createdBy: string): void {
    if (!createdBy || createdBy.trim().length === 0) {
      throw new Error('Created by user ID is required');
    }
  }

  private static validateRole(role: UserRole): void {
    if (!Object.values(UserRole).includes(role)) {
      throw new Error('Invalid user role');
    }
  }

  private static validatePermissions(permissions: string[], role: UserRole): void {
    if (!Array.isArray(permissions)) {
      throw new Error('Permissions must be an array');
    }
    
    // Define role-based permission constraints
    const validPermissions = this.getValidPermissionsForRole(role);
    
    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Permission '${permission}' is not valid for role '${role}'`);
      }
    }
  }

  private static getValidPermissionsForRole(role: UserRole): string[] {
    const basePermissions = {
      [UserRole.CASHIER]: [
        'transactions:create',
        'transactions:read',
        'products:read',
        'inventory:read'
      ],
      [UserRole.MANAGER]: [
        'transactions:create',
        'transactions:read', 
        'transactions:update',
        'products:create',
        'products:read',
        'products:update',
        'inventory:create',
        'inventory:read',
        'inventory:update',
        'reports:read',
        'users:read'
      ],
      [UserRole.ADMIN]: [
        'transactions:create',
        'transactions:read',
        'transactions:update',
        'transactions:delete',
        'products:create',
        'products:read',
        'products:update',
        'products:delete',
        'inventory:create',
        'inventory:read',
        'inventory:update',
        'inventory:delete',
        'reports:read',
        'reports:create',
        'users:create',
        'users:read',
        'users:update',
        'users:delete',
        'store:update',
        'settings:update'
      ]
    };

    return basePermissions[role] || [];
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }
}
