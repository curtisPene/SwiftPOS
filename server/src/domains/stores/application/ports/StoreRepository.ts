import { StoreEntity } from '../../domain/Store';

export interface StoreRepository {
  create(store: StoreEntity): Promise<StoreEntity>;
  findById(id: string): Promise<StoreEntity | null>;
  findByEmail(email: string): Promise<StoreEntity | null>;
  update(store: StoreEntity): Promise<StoreEntity>;
  delete(id: string): Promise<void>;
}