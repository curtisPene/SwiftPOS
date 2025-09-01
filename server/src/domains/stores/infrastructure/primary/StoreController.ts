import { Request, Response } from 'express';
import { RegisterStoreUseCase, RegisterStoreUseCaseRequest } from '../../application/use-cases/RegisterStoreUseCase';
import { StoreRepository } from '../../application/ports/StoreRepository';

export interface StoreControllerDependencies {
  registerStoreUseCase: RegisterStoreUseCase;
  storeRepository: StoreRepository;
}

export class StoreController {
  constructor(private readonly dependencies: StoreControllerDependencies) {}

  /**
   * POST /api/stores
   * Register a new store
   */
  async registerStore(req: Request, res: Response): Promise<void> {
    try {
      // Extract and validate request body
      const {
        name,
        businessType,
        address,
        phone,
        email,
        currency,
        timezone,
        ownerId
      } = req.body;

      // Transform HTTP request to use case request
      const useCaseRequest: RegisterStoreUseCaseRequest = {
        name: name?.trim(),
        businessType: businessType?.trim(),
        address: address?.trim(),
        phone: phone?.trim(),
        email: email?.trim(),
        currency: currency?.trim() || 'FJD',
        timezone: timezone?.trim() || 'Pacific/Fiji',
        ownerId: ownerId?.trim()
      };

      // Execute use case
      const result = await this.dependencies.registerStoreUseCase.execute(useCaseRequest);

      if (result.success && result.store) {
        // Success response
        res.status(201).json({
          success: true,
          message: 'Store registered successfully',
          data: {
            store: this.toStoreResponse(result.store)
          }
        });
      } else {
        // Business logic error (validation, duplicate email, etc.)
        const statusCode = this.getErrorStatusCode(result.error || '');
        res.status(statusCode).json({
          success: false,
          error: result.error || 'Failed to register store'
        });
      }

    } catch (error: any) {
      // Unexpected server error
      console.error('StoreController.registerStore error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/stores/:id
   * Get store by ID
   */
  async getStore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required'
        });
        return;
      }

      const store = await this.dependencies.storeRepository.findById(id);

      if (!store) {
        res.status(404).json({
          success: false,
          error: 'Store not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          store: this.toStoreResponse(store)
        }
      });

    } catch (error: any) {
      console.error('StoreController.getStore error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/stores/email/:email
   * Check if store exists by email (for validation)
   */
  async checkStoreByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      if (!email || email.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      const store = await this.dependencies.storeRepository.findByEmail(email);

      res.status(200).json({
        success: true,
        data: {
          exists: !!store,
          available: !store
        }
      });

    } catch (error: any) {
      console.error('StoreController.checkStoreByEmail error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * PUT /api/stores/:id
   * Update store profile
   */
  async updateStore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        businessType,
        address,
        phone,
        currency,
        timezone,
        isActive
      } = req.body;

      if (!id || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Store ID is required'
        });
        return;
      }

      // Find existing store
      const existingStore = await this.dependencies.storeRepository.findById(id);
      if (!existingStore) {
        res.status(404).json({
          success: false,
          error: 'Store not found'
        });
        return;
      }

      // Update store using domain entity method
      const updateRequest: any = {
        name: name?.trim(),
        businessType: businessType?.trim(),
        address: address?.trim(),
        phone: phone?.trim(),
        currency: currency?.trim(),
        timezone: timezone?.trim()
      };

      // Only include isActive if it's provided
      if (isActive !== undefined) {
        updateRequest.isActive = Boolean(isActive);
      }

      const updatedStore = existingStore.update(updateRequest);
      const savedStore = await this.dependencies.storeRepository.update(updatedStore);

      res.status(200).json({
        success: true,
        message: 'Store updated successfully',
        data: {
          store: this.toStoreResponse(savedStore)
        }
      });

    } catch (error: any) {
      console.error('StoreController.updateStore error:', error);
      
      const statusCode = this.getErrorStatusCode(error.message);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to update store'
      });
    }
  }

  /**
   * Transform domain entity to HTTP response DTO
   * Hides internal domain structure from API consumers
   */
  private toStoreResponse(store: any) {
    return {
      id: store.id,
      name: store.name,
      businessType: store.businessType,
      address: store.address,
      phone: store.phone,
      email: store.email,
      currency: store.currency,
      timezone: store.timezone,
      isActive: store.isActive,
      ownerId: store.ownerId,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    };
  }

  /**
   * Map domain errors to appropriate HTTP status codes
   */
  private getErrorStatusCode(errorMessage: string): number {
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return 409; // Conflict
    }
    if (errorMessage.includes('required') || errorMessage.includes('invalid') || 
        errorMessage.includes('must be')) {
      return 400; // Bad Request
    }
    if (errorMessage.includes('not found')) {
      return 404; // Not Found
    }
    return 500; // Internal Server Error
  }
}

// Factory function for dependency injection
export const createStoreController = (dependencies: StoreControllerDependencies): StoreController => {
  return new StoreController(dependencies);
};