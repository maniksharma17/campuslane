import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from '../config/database';
import { Admin } from '../models/Admin';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';
import { Content } from '../models/Content';
import { School } from '../models/School';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { classesData } from './data/classes';
import { subjectsData } from './data/subjects';
import { chaptersData } from './data/chapters';
import { usersData } from './data/users';
import { schoolsData } from './data/schools';
import { categoriesData } from './data/categories';
import { getProductsData } from './data/products';

const seedDatabase = async () => {
  try {
    await connectDatabase();

    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      User.deleteMany({}),
      Class.deleteMany({}),
      Subject.deleteMany({}),
      Chapter.deleteMany({}),
      Content.deleteMany({}),
      School.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
    ]);

    console.log('✅ Cleared existing data');

    // Create admin
    const adminData = {
      email: process.env.ADMIN_EMAIL || 'admin@campuslane.com',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      name: 'Super Admin',
    };

    const admin = new Admin(adminData);
    await admin.save();
    console.log('✅ Created admin user');

    // Create classes
    const classes = await Class.insertMany(classesData);
    console.log('✅ Created classes');

    // Create subjects for each class
    const subjectPromises = [];
    for (const classItem of classes) {
      for (const subjectData of subjectsData) {
        subjectPromises.push(
          Subject.create({
            ...subjectData,
            classId: classItem._id,
          })
        );
      }
    }
    const subjects = await Promise.all(subjectPromises);
    console.log('✅ Created subjects');

    // Create chapters for each subject
    const chapterPromises = [];
    for (const subject of subjects) {
      const subjectName = subject.name;
      let relevantChapters = [];

      if (subjectName === 'English') {
        relevantChapters = chaptersData.slice(0, 3);
      } else if (subjectName === 'Maths') {
        relevantChapters = chaptersData.slice(3, 6);
      } else if (subjectName === 'EVS') {
        relevantChapters = chaptersData.slice(6, 9);
      } else if (subjectName === 'Spoken English Course') {
        relevantChapters = chaptersData.slice(9, 11);
      }

      for (const chapterData of relevantChapters) {
        chapterPromises.push(
          Chapter.create({
            ...chapterData,
            subjectId: subject._id,
          })
        );
      }
    }
    const chapters = await Promise.all(chapterPromises);
    console.log('✅ Created chapters');

    // Create users
    const users = await User.insertMany(usersData);
    console.log('✅ Created users');

    // Create sample content
    const teacher = users.find(u => u.role === 'teacher');
    const class3 = classes.find(c => c.name === 'Class 3');
    const englishSubject = subjects.find(s => s.name === 'English' && s.classId.toString() === class3!._id.toString());
    const firstChapter = chapters.find(c => c.subjectId.toString() === englishSubject!._id.toString());

    const contentData = [
      {
        title: 'Introduction to Reading',
        description: 'Basic reading skills and techniques',
        classId: class3!._id,
        subjectId: englishSubject!._id,
        chapterId: firstChapter!._id,
        type: 'file',
        fileUrl: 'https://example.com/sample-document.pdf',
        uploaderId: teacher!._id,
        uploaderRole: 'teacher',
        approvalStatus: 'pending',
        tags: ['reading', 'basics'],
      },
      {
        title: 'Grammar Video Lesson',
        description: 'Interactive video about basic grammar',
        classId: class3!._id,
        subjectId: englishSubject!._id,
        chapterId: firstChapter!._id,
        type: 'video',
        videoUrl: 'https://example.com/sample-video.mp4',
        uploaderId: teacher!._id,
        uploaderRole: 'teacher',
        approvalStatus: 'approved',
        tags: ['grammar', 'video'],
      },
      {
        title: 'Reading Comprehension Quiz',
        description: 'Test your reading understanding',
        classId: class3!._id,
        subjectId: englishSubject!._id,
        chapterId: firstChapter!._id,
        type: 'quiz',
        quizType: 'googleForm',
        googleFormUrl: 'https://forms.google.com/sample-quiz',
        uploaderId: teacher!._id,
        uploaderRole: 'teacher',
        approvalStatus: 'approved',
        tags: ['quiz', 'comprehension'],
      },
    ];

    await Content.insertMany(contentData);
    console.log('✅ Created sample content');

    // Create schools
    const schools = await School.insertMany(schoolsData);
    console.log('✅ Created schools');

    // Create categories
    const categories = await Category.insertMany(categoriesData);
    console.log('✅ Created categories');

    // Create products
    const products = await Product.insertMany(
      getProductsData(
        categories.map(c => c._id),
        schools.map(s => s._id)
      )
    );
    console.log('✅ Created products');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📧 Admin Login: ${adminData.email} / ${adminData.password}`);
    console.log(`👨‍🏫 Sample Teacher: ${teacher?.email}`);
    console.log(`👩‍👧 Sample Parent: ${users.find(u => u.role === 'parent')?.email}`);
    console.log(`👦 Sample Student: ${users.find(u => u.role === 'student')?.email} (Code: ${users.find(u => u.role === 'student')?.studentCode})`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

// Run seeding
seedDatabase();