import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IHero extends Document {
  heading: string;
  subheading: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HeroSchema = new Schema<IHero>(
  {
    heading: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    subheading: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    primaryButtonText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    primaryButtonLink: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    secondaryButtonText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    secondaryButtonLink: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'hero_sections',
  }
);

HeroSchema.index({ isActive: 1, updatedAt: -1 });

const Hero = (mongoose.models.Hero as Model<IHero>) || mongoose.model<IHero>('Hero', HeroSchema);

export default Hero;
