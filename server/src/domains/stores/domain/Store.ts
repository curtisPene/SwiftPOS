import { BusinessType } from "./BusinessType";
import { Currency } from "./Currency";

export interface Store {
  id: string;
  name: string;
  businessType: BusinessType;
  address: string;
  phone: string;
  email: string;
  currency: Currency;
  timezone: string;
  isActive: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoreRequest {
  name: string;
  businessType: BusinessType;
  address: string;
  phone: string;
  email: string;
  currency: Currency;
  timezone: string;
  ownerId: string;
}

export interface UpdateStoreRequest {
  name?: string;
  businessType?: BusinessType;
  address?: string;
  phone?: string;
  currency?: Currency;
  timezone?: string;
  isActive?: boolean;
}

export class StoreEntity implements Store {
  constructor(
    public readonly name: string,
    public readonly id: string,
    public readonly businessType: BusinessType,
    public readonly address: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly currency: Currency,
    public readonly timezone: string,
    public readonly isActive: boolean,
    public readonly ownerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(request: CreateStoreRequest): StoreEntity {
    // Business rule validations
    this.validateName(request.name);
    this.validateEmail(request.email);
    this.validatePhone(request.phone);
    this.validateAddress(request.address);
    this.validateOwnerId(request.ownerId);

    const now = new Date();
    const id = this.generateId();

    return new StoreEntity(
      id,
      request.name.trim(),
      request.businessType,
      request.address.trim(),
      request.phone.trim(),
      request.email.toLowerCase().trim(),
      request.currency,
      request.timezone,
      true, // New stores are active by default
      request.ownerId,
      now,
      now
    );
  }

  update(request: UpdateStoreRequest): StoreEntity {
    if (request.name !== undefined) {
      StoreEntity.validateName(request.name);
    }
    if (request.phone !== undefined) {
      StoreEntity.validatePhone(request.phone);
    }
    if (request.address !== undefined) {
      StoreEntity.validateAddress(request.address);
    }

    return new StoreEntity(
      this.id,
      request.name?.trim() ?? this.name,
      request.businessType ?? this.businessType,
      request.address?.trim() ?? this.address,
      request.phone?.trim() ?? this.phone,
      this.email, // Email cannot be updated
      request.currency ?? this.currency,
      request.timezone ?? this.timezone,
      request.isActive ?? this.isActive,
      this.ownerId, // Owner cannot be changed
      this.createdAt,
      new Date()
    );
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Store name is required");
    }
    if (name.trim().length < 2) {
      throw new Error("Store name must be at least 2 characters");
    }
    if (name.trim().length > 100) {
      throw new Error("Store name cannot exceed 100 characters");
    }
  }

  private static validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error("Store email is required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email format");
    }
  }

  private static validatePhone(phone: string): void {
    if (!phone || phone.trim().length === 0) {
      throw new Error("Store phone is required");
    }
    if (phone.trim().length < 7) {
      throw new Error("Phone number must be at least 7 digits");
    }
  }

  private static validateAddress(address: string): void {
    if (!address || address.trim().length === 0) {
      throw new Error("Store address is required");
    }
    if (address.trim().length < 5) {
      throw new Error("Address must be at least 5 characters");
    }
  }

  private static validateOwnerId(ownerId: string): void {
    if (!ownerId || ownerId.trim().length === 0) {
      throw new Error("Owner ID is required");
    }
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }
}
