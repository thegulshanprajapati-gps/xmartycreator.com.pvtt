export interface CourseCurriculum {
  moduleId: string;
  moduleName: string;
  lessons: Array<{
    lessonId: string;
    title: string;
    duration: string;
  }>;
}

export interface Course {
  _id?: string;
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage: string;
  duration: string;
  rating: number;
  studentsEnrolled?: number;
  reviews?: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  discount?: number;
  originalPrice?: number;
  features: string[];
  curriculum: CourseCurriculum[];
  instructor: {
    name: string;
    title: string;
    bio: string;
    image: string;
  };
  whatYouLearn: string[];
  requirements: string[];
  enrollClickCount?: number;
  shareCount?: number;
  viewsCount?: number;
  enrollRedirectUrl?: string;
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'Web Development Masterclass',
    slug: 'web-development-masterclass',
    shortDescription: 'Learn modern web development with React, Node.js and more',
    fullDescription: 'Master the complete web development stack. From HTML/CSS fundamentals to advanced React patterns and backend development with Node.js. Build real-world projects and deploy them to production.',
    coverImage: 'https://picsum.photos/seed/web-dev/600/400',
    duration: '12 weeks',
    rating: 4.8,
    reviews: 2341,
    level: 'Intermediate',
    price: 99,
    originalPrice: 199,
    features: [
      'Live project-based learning',
      'One-on-one mentoring',
      'Lifetime access to course materials',
      'Job placement assistance',
      '30-day money-back guarantee'
    ],
    curriculum: [
      {
        moduleId: 'm1',
        moduleName: 'HTML & CSS Fundamentals',
        lessons: [
          { lessonId: 'l1', title: 'Introduction to HTML', duration: '1h 30m' },
          { lessonId: 'l2', title: 'CSS Basics and Layouts', duration: '2h' },
          { lessonId: 'l3', title: 'Responsive Design', duration: '1h 45m' }
        ]
      },
      {
        moduleId: 'm2',
        moduleName: 'JavaScript Essentials',
        lessons: [
          { lessonId: 'l4', title: 'Variables and Data Types', duration: '1h' },
          { lessonId: 'l5', title: 'Functions and ES6+', duration: '2h 30m' },
          { lessonId: 'l6', title: 'DOM Manipulation', duration: '1h 45m' }
        ]
      },
      {
        moduleId: 'm3',
        moduleName: 'React Deep Dive',
        lessons: [
          { lessonId: 'l7', title: 'Components and Props', duration: '1h 30m' },
          { lessonId: 'l8', title: 'Hooks and State Management', duration: '2h' },
          { lessonId: 'l9', title: 'Advanced Patterns', duration: '2h 15m' }
        ]
      }
    ],
    instructor: {
      name: 'Sarah Johnson',
      title: 'Senior Full Stack Developer',
      bio: 'With 10+ years of experience, Sarah has built products at leading tech companies.',
      image: 'https://picsum.photos/seed/instructor1/150/150'
    },
    whatYouLearn: [
      'Build modern responsive websites with HTML, CSS, and JavaScript',
      'Master React and create dynamic single-page applications',
      'Work with API integrations and backend services',
      'Deploy applications to production using modern hosting platforms',
      'Write clean, maintainable code following industry best practices',
      'Collaborate effectively in development teams'
    ],
    requirements: ['Basic understanding of programming concepts', 'A text editor and browser', 'Passion to learn']
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    slug: 'advanced-react-patterns',
    shortDescription: 'Master advanced React concepts and patterns for production apps',
    fullDescription: 'Deep dive into advanced React concepts including custom hooks, render props, compound components, and performance optimization. Learn patterns used by top tech companies.',
    coverImage: 'https://picsum.photos/seed/react-advanced/600/400',
    duration: '8 weeks',
    rating: 4.9,
    reviews: 1823,
    level: 'Advanced',
    price: 129,
    originalPrice: 249,
    features: [
      'Advanced code patterns and architectures',
      'Performance optimization techniques',
      'Real project implementations',
      'Access to exclusive community',
      'Certificate of completion'
    ],
    curriculum: [
      {
        moduleId: 'm1',
        moduleName: 'React Fundamentals Review',
        lessons: [
          { lessonId: 'l1', title: 'Component Architecture', duration: '1h 30m' },
          { lessonId: 'l2', title: 'State Management Basics', duration: '1h 45m' }
        ]
      },
      {
        moduleId: 'm2',
        moduleName: 'Custom Hooks & Patterns',
        lessons: [
          { lessonId: 'l3', title: 'Building Custom Hooks', duration: '2h' },
          { lessonId: 'l4', title: 'Render Props Pattern', duration: '1h 45m' },
          { lessonId: 'l5', title: 'Compound Components', duration: '2h 15m' }
        ]
      }
    ],
    instructor: {
      name: 'Mike Chen',
      title: 'React Specialist & Open Source Contributor',
      bio: 'Mike has contributed to major React projects and mentored hundreds of developers.',
      image: 'https://picsum.photos/seed/instructor2/150/150'
    },
    whatYouLearn: [
      'Create reusable custom hooks',
      'Implement advanced component patterns',
      'Optimize rendering performance',
      'Handle complex state management',
      'Build scalable React applications',
      'Master testing strategies'
    ],
    requirements: ['Solid React fundamentals', 'Understanding of JavaScript ES6+', 'Previous React project experience']
  },
  {
    id: '3',
    title: 'Mobile App Development with React Native',
    slug: 'mobile-app-development-react-native',
    shortDescription: 'Build native iOS and Android apps with React Native',
    fullDescription: 'Learn to build high-performance mobile applications for both iOS and Android platforms using React Native. Create a complete app from idea to app store.',
    coverImage: 'https://picsum.photos/seed/react-native/600/400',
    duration: '10 weeks',
    rating: 4.7,
    reviews: 1654,
    level: 'Intermediate',
    price: 119,
    originalPrice: 229,
    features: [
      'iOS and Android development',
      'Native modules integration',
      'App store deployment guide',
      'Firebase integration',
      'Push notifications setup'
    ],
    curriculum: [
      {
        moduleId: 'm1',
        moduleName: 'React Native Basics',
        lessons: [
          { lessonId: 'l1', title: 'Setup & Environment', duration: '1h' },
          { lessonId: 'l2', title: 'Core Components', duration: '2h' },
          { lessonId: 'l3', title: 'Navigation Setup', duration: '1h 30m' }
        ]
      },
      {
        moduleId: 'm2',
        moduleName: 'Building Real Apps',
        lessons: [
          { lessonId: 'l4', title: 'API Integration', duration: '2h' },
          { lessonId: 'l5', title: 'Local Storage', duration: '1h 45m' },
          { lessonId: 'l6', title: 'Testing & Debugging', duration: '1h 30m' }
        ]
      }
    ],
    instructor: {
      name: 'Lisa Rodriguez',
      title: 'Mobile Developer & App Creator',
      bio: 'Lisa has published 15+ apps with millions of downloads across app stores.',
      image: 'https://picsum.photos/seed/instructor3/150/150'
    },
    whatYouLearn: [
      'Build cross-platform mobile apps',
      'Work with native modules',
      'Integrate with backend services',
      'Handle offline functionality',
      'Deploy to App Store and Google Play',
      'Monetize your applications'
    ],
    requirements: ['React knowledge', 'JavaScript ES6+', 'Node.js basics']
  },
  {
    id: '4',
    title: 'Data Science & Machine Learning',
    slug: 'data-science-machine-learning',
    shortDescription: 'Master data science, machine learning and analytics',
    fullDescription: 'Comprehensive guide to data science and machine learning. Learn Python, data analysis, visualization, and build predictive models.',
    coverImage: 'https://picsum.photos/seed/data-science/600/400',
    duration: '14 weeks',
    rating: 4.6,
    reviews: 1432,
    level: 'Intermediate',
    price: 149,
    originalPrice: 299,
    features: [
      'Real datasets and projects',
      'Python and ML libraries',
      'Data visualization techniques',
      'Kaggle competition practice',
      'Job-ready portfolio projects'
    ],
    curriculum: [
      {
        moduleId: 'm1',
        moduleName: 'Python Fundamentals',
        lessons: [
          { lessonId: 'l1', title: 'Python Basics', duration: '2h' },
          { lessonId: 'l2', title: 'NumPy & Pandas', duration: '2h 30m' }
        ]
      },
      {
        moduleId: 'm2',
        moduleName: 'Machine Learning',
        lessons: [
          { lessonId: 'l3', title: 'Supervised Learning', duration: '3h' },
          { lessonId: 'l4', title: 'Unsupervised Learning', duration: '2h 30m' }
        ]
      }
    ],
    instructor: {
      name: 'Dr. Aisha Patel',
      title: 'Data Scientist & AI Researcher',
      bio: 'PhD in Computer Science with 8+ years of ML industry experience.',
      image: 'https://picsum.photos/seed/instructor4/150/150'
    },
    whatYouLearn: [
      'Data cleaning and preprocessing',
      'Exploratory data analysis',
      'Statistical modeling',
      'Machine learning algorithms',
      'Deep learning basics',
      'Model deployment and MLOps'
    ],
    requirements: ['Python basics', 'Basic statistics', 'College-level mathematics']
  },
  {
    id: '5',
    title: 'Cloud Architecture with AWS',
    slug: 'cloud-architecture-aws',
    shortDescription: 'Deploy and manage applications on AWS',
    fullDescription: 'Master AWS cloud platform. Learn EC2, S3, RDS, Lambda, and build scalable cloud-native applications.',
    coverImage: 'https://picsum.photos/seed/aws-cloud/600/400',
    duration: '9 weeks',
    rating: 4.8,
    reviews: 1987,
    level: 'Intermediate',
    price: 139,
    originalPrice: 279,
    features: [
      'AWS certification prep',
      'VPC and networking',
      'Database design',
      'Serverless computing',
      'Hands-on labs with real AWS'
    ],
    curriculum: [
      {
        moduleId: 'm1',
        moduleName: 'AWS Fundamentals',
        lessons: [
          { lessonId: 'l1', title: 'AWS Account Setup', duration: '1h' },
          { lessonId: 'l2', title: 'EC2 Instances', duration: '2h 30m' },
          { lessonId: 'l3', title: 'S3 Storage', duration: '2h' }
        ]
      },
      {
        moduleId: 'm2',
        moduleName: 'Advanced Services',
        lessons: [
          { lessonId: 'l4', title: 'RDS Databases', duration: '2h' },
          { lessonId: 'l5', title: 'Lambda Functions', duration: '1h 45m' }
        ]
      }
    ],
    instructor: {
      name: 'John Smith',
      title: 'AWS Solutions Architect',
      bio: 'Certified AWS Solutions Architect with 7 years of cloud experience.',
      image: 'https://picsum.photos/seed/instructor5/150/150'
    },
    whatYouLearn: [
      'AWS core services',
      'Designing scalable architectures',
      'Database management',
      'Security best practices',
      'Cost optimization',
      'AWS certification readiness'
    ],
    requirements: ['Basic networking knowledge', 'Linux/command line basics', 'Understanding of web technologies']
  },
  {
    id: '6',
    title: 'DevOps & CI/CD Mastery',
    slug: 'devops-ci-cd-mastery',
    shortDescription: 'Learn containerization, Docker, Kubernetes and automation',
    fullDescription: 'Complete DevOps learning path. Master Docker, Kubernetes, CI/CD pipelines, and infrastructure as code.',
    coverImage: 'https://picsum.photos/seed/devops/600/400',
    duration: '11 weeks',
    rating: 4.9,
    reviews: 1756,
    level: 'Advanced',
    price: 159,
    originalPrice: 319,
    features: [
      'Docker containerization',
      'Kubernetes orchestration',
      'GitHub Actions CI/CD',
      'Infrastructure as Code',
      'Production deployment'
    ],
    curriculum: [
      {
        moduleId: 'm1',
        moduleName: 'Docker Essentials',
        lessons: [
          { lessonId: 'l1', title: 'Docker Basics', duration: '2h' },
          { lessonId: 'l2', title: 'Docker Compose', duration: '1h 45m' }
        ]
      },
      {
        moduleId: 'm2',
        moduleName: 'Kubernetes & Orchestration',
        lessons: [
          { lessonId: 'l3', title: 'Kubernetes Fundamentals', duration: '2h 30m' },
          { lessonId: 'l4', title: 'Deployments & Services', duration: '2h' }
        ]
      }
    ],
    instructor: {
      name: 'James Wilson',
      title: 'DevOps Engineer & Container Expert',
      bio: 'Led DevOps transformation at multiple Fortune 500 companies.',
      image: 'https://picsum.photos/seed/instructor6/150/150'
    },
    whatYouLearn: [
      'Containerize applications',
      'Orchestrate containers at scale',
      'Build automated pipelines',
      'Infrastructure provisioning',
      'Monitoring and logging',
      'Production-ready deployments'
    ],
    requirements: ['Linux command line', 'Programming fundamentals', 'Networking basics']
  }
];

export function getCourseBySlug(slug: string): Course | undefined {
  return courses.find(course => course.slug === slug);
}

export function getAllCourses(): Course[] {
  return courses;
}
