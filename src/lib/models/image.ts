import mongoose, { Schema, Document } from 'mongoose';

export interface IImage extends Document {
  _id: string;
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  uploadedAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ImageSchema.index({ id: 1 });
ImageSchema.index({ tags: 1 });

export const Image = mongoose.models.Image || mongoose.model<IImage>('Image', ImageSchema);
