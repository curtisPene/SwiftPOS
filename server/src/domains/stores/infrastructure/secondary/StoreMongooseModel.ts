import mongoose, { Schema, Document } from "mongoose";
import { BusinessType } from "../../domain/BusinessType";
import { Currency } from "../../domain/Currency";
import { Store } from "../../domain/Store";

export interface IStoreDocument extends Document, Omit<Store, "id"> {
  _id: mongoose.Types.ObjectId;
}

const StoreSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    businessType: {
      type: String,
      enum: Object.values(BusinessType),
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    currency: {
      type: String,
      enum: Object.values(Currency),
      required: true,
      default: Currency.FJD,
    },
    timezone: {
      type: String,
      required: true,
      default: "Pacific/Fiji",
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "stores",
  }
);

// Indexes
StoreSchema.index({ email: 1 }, { unique: true });
StoreSchema.index({ ownerId: 1 });
StoreSchema.index({ isActive: 1 });
StoreSchema.index({ businessType: 1 });

// Transform to match domain entity
StoreSchema.set("toJSON", {
  transform: function (doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const StoreModel = mongoose.model<IStoreDocument>("Store", StoreSchema);
