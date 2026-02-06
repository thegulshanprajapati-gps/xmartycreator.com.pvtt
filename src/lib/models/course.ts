import mongoose from 'mongoose';

const courseCurriculumSchema = new mongoose.Schema({
  moduleId: String,
  moduleName: String,
  lessons: [{
    lessonId: String,
    title: String,
    duration: String
  }]
});

const courseSchema = new mongoose.Schema({
  id: String,
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  shortDescription: String,
  fullDescription: String,
  coverImage: String,
  duration: String,
  price: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  studentsCount: { type: Number, default: 0, min: 0 },
  studentsEnrolled: { type: Number, default: 0, min: 0 },
  reviews: { type: Number, default: 0 },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  originalPrice: Number,
  features: [String],
  curriculum: [courseCurriculumSchema],
  instructor: {
    name: String,
    title: String,
    bio: String,
    image: String
  },
  instructorName: String,
  instructorImage: String,
  enrollRedirectUrl: String,
  whatYouLearn: [String],
  requirements: [String],
  shareCount: { type: Number, default: 0, min: 0 },
  enrollClickCount: { type: Number, default: 0, min: 0 },
  viewsCount: { type: Number, default: 0, min: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
