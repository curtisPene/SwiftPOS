import { StoreRepository } from '../ports/StoreRepository';
import { StoreEntity, CreateStoreRequest } from '../../domain/Store';

export interface RegisterStoreUseCaseRequest {
  name: string;
  businessType: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  timezone: string;
  ownerId: string;
}

export interface RegisterStoreUseCaseResponse {
  success: boolean;
  store?: StoreEntity;
  error?: string;
}

export class RegisterStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(request: RegisterStoreUseCaseRequest): Promise<RegisterStoreUseCaseResponse> {
    try {
      // 1. Input validation
      this.validateRequest(request);

      // 2. Business rule validation - email must be unique globally
      const existingStore = await this.storeRepository.findByEmail(request.email);
      if (existingStore) {
        return {
          success: false,
          error: 'A store with this email address already exists'
        };
      }

      // 3. Create domain entity using factory method (includes domain validation)
      const createStoreRequest: CreateStoreRequest = {
        name: request.name,
        businessType: request.businessType as any, // Type assertion for enum
        address: request.address,
        phone: request.phone,
        email: request.email,
        currency: request.currency as any, // Type assertion for enum
        timezone: request.timezone,
        ownerId: request.ownerId
      };

      const storeEntity = StoreEntity.create(createStoreRequest);

      // 4. Persist via repository
      const savedStore = await this.storeRepository.create(storeEntity);

      // 5. Return success result
      return {
        success: true,
        store: savedStore
      };

    } catch (error: any) {
      // Handle domain validation errors and repository errors
      return {
        success: false,
        error: error.message || 'Failed to register store'
      };
    }
  }

  private validateRequest(request: RegisterStoreUseCaseRequest): void {
    const requiredFields = [
      'name', 'businessType', 'address', 'phone', 
      'email', 'currency', 'timezone', 'ownerId'
    ];

    for (const field of requiredFields) {
      if (!request[field as keyof RegisterStoreUseCaseRequest]) {
        throw new Error(`${field} is required`);
      }
    }

    // Additional input validation
    if (typeof request.name !== 'string' || request.name.trim().length === 0) {
      throw new Error('Store name must be a non-empty string');
    }

    if (typeof request.email !== 'string' || !this.isValidEmail(request.email)) {
      throw new Error('Valid email address is required');
    }

    if (typeof request.phone !== 'string' || request.phone.trim().length < 7) {
      throw new Error('Valid phone number is required');
    }

    if (typeof request.address !== 'string' || request.address.trim().length < 5) {
      throw new Error('Valid address is required');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}

// Factory function for dependency injection
export const createRegisterStoreUseCase = (storeRepository: StoreRepository): RegisterStoreUseCase => {
  return new RegisterStoreUseCase(storeRepository);
};