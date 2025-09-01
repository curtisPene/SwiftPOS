import { StoreRepository } from '../../application/ports/StoreRepository';
import { StoreEntity } from '../../domain/Store';
import { StoreModel, IStoreDocument } from './StoreMongooseModel';

export class MongoStoreRepository implements StoreRepository {
  
  async create(store: StoreEntity): Promise<StoreEntity> {
    try {
      const storeDoc = new StoreModel({
        _id: store.id,
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
      });

      const savedDoc = await storeDoc.save();
      return this.toDomainEntity(savedDoc);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Store with this email already exists');
      }
      throw new Error(`Failed to create store: ${error.message}`);
    }
  }

  async findById(id: string): Promise<StoreEntity | null> {
    try {
      const storeDoc = await StoreModel.findById(id);
      return storeDoc ? this.toDomainEntity(storeDoc) : null;
    } catch (error: any) {
      throw new Error(`Failed to find store by id: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<StoreEntity | null> {
    try {
      const storeDoc = await StoreModel.findOne({ email: email.toLowerCase() });
      return storeDoc ? this.toDomainEntity(storeDoc) : null;
    } catch (error: any) {
      throw new Error(`Failed to find store by email: ${error.message}`);
    }
  }

  async update(store: StoreEntity): Promise<StoreEntity> {
    try {
      const storeDoc = await StoreModel.findByIdAndUpdate(
        store.id,
        {
          name: store.name,
          businessType: store.businessType,
          address: store.address,
          phone: store.phone,
          currency: store.currency,
          timezone: store.timezone,
          isActive: store.isActive,
          updatedAt: store.updatedAt
        },
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validation
        }
      );

      if (!storeDoc) {
        throw new Error('Store not found');
      }

      return this.toDomainEntity(storeDoc);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Store with this email already exists');
      }
      throw new Error(`Failed to update store: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await StoreModel.findByIdAndDelete(id);
      if (!result) {
        throw new Error('Store not found');
      }
    } catch (error: any) {
      throw new Error(`Failed to delete store: ${error.message}`);
    }
  }

  /**
   * Converts MongoDB document to domain entity
   * This is the adapter pattern - translating between infrastructure and domain
   */
  private toDomainEntity(doc: IStoreDocument): StoreEntity {
    return new StoreEntity(
      doc._id.toString(), // Convert ObjectId to string
      doc.name,
      doc.businessType,
      doc.address,
      doc.phone,
      doc.email,
      doc.currency,
      doc.timezone,
      doc.isActive,
      doc.ownerId,
      doc.createdAt,
      doc.updatedAt
    );
  }

  /**
   * Helper method to check if store exists by ID
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await StoreModel.countDocuments({ _id: id });
      return count > 0;
    } catch (error: any) {
      throw new Error(`Failed to check store existence: ${error.message}`);
    }
  }

  /**
   * Find active stores by business type
   */
  async findActiveByBusinessType(businessType: string): Promise<StoreEntity[]> {
    try {
      const storeDocs = await StoreModel.find({ 
        businessType, 
        isActive: true 
      }).sort({ name: 1 });
      
      return storeDocs.map(doc => this.toDomainEntity(doc));
    } catch (error: any) {
      throw new Error(`Failed to find stores by business type: ${error.message}`);
    }
  }
}