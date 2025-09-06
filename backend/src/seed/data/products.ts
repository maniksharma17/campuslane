import mongoose from 'mongoose';

export const getProductsData = (categoryIds: mongoose.Types.ObjectId[], schoolIds: mongoose.Types.ObjectId[]) => [
  {
    name: 'School Uniform Shirt - White',
    description: 'Official white school uniform shirt',
    category: categoryIds[0], // School Uniforms
    images: ['https://images.pexels.com/photos/5212665/pexels-photo-5212665.jpeg'],
    variants: [
      { name: 'Size S', price: 450, cutoffPrice: 500, stock: 50 },
      { name: 'Size M', price: 450, cutoffPrice: 500, stock: 45 },
      { name: 'Size L', price: 450, cutoffPrice: 500, stock: 30 },
    ],
    school: schoolIds[0],
    gender: 'Unisex',
    classLevel: 'Class 3-5',
    type: 'Shirt',
    isActive: true,
  },
  {
    name: 'Mathematics Workbook Grade 4',
    description: 'Comprehensive mathematics practice workbook',
    category: categoryIds[1], // Books & Stationery
    images: ['https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg'],
    variants: [
      { name: 'Standard Edition', price: 250, cutoffPrice: 300, stock: 100 },
    ],
    classLevel: 'Class 4',
    subject: 'Maths',
    brand: 'EduBooks',
    type: 'Workbook',
    isActive: true,
  },
  {
    name: 'Educational Building Blocks',
    description: 'Colorful building blocks for creative learning',
    category: categoryIds[2], // Educational Toys
    images: ['https://images.pexels.com/photos/374918/pexels-photo-374918.jpeg'],
    variants: [
      { name: '50 Pieces Set', price: 800, cutoffPrice: 1000, stock: 25 },
      { name: '100 Pieces Set', price: 1400, cutoffPrice: 1600, stock: 15 },
    ],
    gender: 'Unisex',
    type: 'Building Toy',
    brand: 'LearnFun',
    isActive: true,
  },
  {
    name: 'School Uniform Trouser - Navy',
    description: 'Official navy blue school uniform trouser',
    category: categoryIds[0], // School Uniforms
    images: ['https://images.pexels.com/photos/5212665/pexels-photo-5212665.jpeg'],
    variants: [
      { name: 'Size 28', price: 550, cutoffPrice: 600, stock: 30 },
      { name: 'Size 30', price: 550, cutoffPrice: 600, stock: 35 },
      { name: 'Size 32', price: 550, cutoffPrice: 600, stock: 20 },
    ],
    school: schoolIds[0],
    gender: 'Boys',
    classLevel: 'Class 3-5',
    type: 'Trouser',
    isActive: true,
  },
  {
    name: 'English Story Books Collection',
    description: 'Set of 5 illustrated English story books',
    category: categoryIds[1], // Books & Stationery
    images: ['https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg'],
    variants: [
      { name: 'Beginner Level', price: 650, cutoffPrice: 750, stock: 40 },
      { name: 'Intermediate Level', price: 750, cutoffPrice: 850, stock: 35 },
    ],
    classLevel: 'Class 3-5',
    subject: 'English',
    brand: 'StoryTime',
    type: 'Story Books',
    isActive: true,
  },
  {
    name: 'Science Experiment Kit',
    description: 'Safe science experiments for young learners',
    category: categoryIds[2], // Educational Toys
    images: ['https://images.pexels.com/photos/374918/pexels-photo-374918.jpeg'],
    variants: [
      { name: 'Basic Kit', price: 1200, cutoffPrice: 1400, stock: 20 },
      { name: 'Advanced Kit', price: 1800, cutoffPrice: 2000, stock: 15 },
    ],
    gender: 'Unisex',
    classLevel: 'Class 4-5',
    subject: 'EVS',
    brand: 'ScienceFun',
    type: 'Experiment Kit',
    isActive: true,
  },
];