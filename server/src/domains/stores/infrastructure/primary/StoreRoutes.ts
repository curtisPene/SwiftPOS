import { Router } from 'express';
import { MongoStoreRepository } from '../secondary/MongoStoreRepository';
import { RegisterStoreUseCase } from '../../application/use-cases/RegisterStoreUseCase';
import { StoreController, StoreControllerDependencies } from './StoreController';

export const createStoreRoutes = (): Router => {
  const router = Router();

  // Dependency injection setup
  const storeRepository = new MongoStoreRepository();
  const registerStoreUseCase = new RegisterStoreUseCase(storeRepository);
  
  const controllerDependencies: StoreControllerDependencies = {
    registerStoreUseCase,
    storeRepository
  };
  
  const storeController = new StoreController(controllerDependencies);

  // Route definitions
  
  /**
   * POST /api/stores
   * Register a new store
   */
  router.post('/', async (req, res) => {
    await storeController.registerStore(req, res);
  });

  /**
   * GET /api/stores/email/:email
   * Check if store exists by email (for validation)
   */
  router.get('/email/:email', async (req, res) => {
    await storeController.checkStoreByEmail(req, res);
  });

  /**
   * GET /api/stores/:id
   * Get store by ID
   */
  router.get('/:id', async (req, res) => {
    await storeController.getStore(req, res);
  });

  /**
   * PUT /api/stores/:id
   * Update store profile
   */
  router.put('/:id', async (req, res) => {
    await storeController.updateStore(req, res);
  });

  return router;
};

// Export for integration with main Express app
export { createStoreRoutes as storeRoutes };