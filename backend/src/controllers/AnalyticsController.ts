import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Content } from '../models/Content';
import { Progress } from '../models/Progress';
import { Order } from '../models/Order';
import { asyncHandler } from '../utils/asyncHandler';
import mongoose from 'mongoose';

export class AnalyticsController {
  static getAdminUserAnalytics = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      pendingTeachers,
      approvedTeachers,
      rejectedTeachers
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isDeleted: false }),
      User.countDocuments({ role: 'teacher', isDeleted: false }),
      User.countDocuments({ role: 'parent', isDeleted: false }),
      User.countDocuments({ role: 'teacher', approvalStatus: 'pending', isDeleted: false }),
      User.countDocuments({ role: 'teacher', approvalStatus: 'approved', isDeleted: false }),
      User.countDocuments({ role: 'teacher', approvalStatus: 'rejected', isDeleted: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          totalStudents,
          totalTeachers,
          totalParents,
          total: totalStudents + totalTeachers + totalParents,
        },
        teachers: {
          pending: pendingTeachers,
          approved: approvedTeachers,
          rejected: rejectedTeachers,
        },
      },
    });
  });

  static getAdminContentAnalytics = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const [
      contentByType,
      contentByApproval,
      topSubjects
    ] = await Promise.all([
      Content.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Content.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
      ]),
      Content.aggregate([
        { $match: { isDeleted: false, approvalStatus: 'approved' } },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject',
          },
        },
        { $unwind: '$subject' },
        { $group: { _id: '$subject.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        contentByType,
        contentByApproval,
        topSubjects,
      },
    });
  });

  static getAdminEngagementAnalytics = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const [
      completionRate,
      avgTimeSpent,
      avgQuizScore
    ] = await Promise.all([
      Progress.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
              } 
            },
          },
        },
        {
          $project: {
            _id: 0,
            completionRate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $multiply: [{ $divide: ['$completed', '$total'] }, 100] }
              ]
            },
          },
        },
      ]).then(result => result[0]?.completionRate || 0),
      Progress.aggregate([
        { $group: { _id: null, avgTimeSpent: { $avg: '$timeSpent' } } },
      ]).then(result => Math.round(result[0]?.avgTimeSpent || 0)),
      Progress.aggregate([
        { $match: { quizScore: { $exists: true } } },
        { $group: { _id: null, avgScore: { $avg: '$quizScore' } } },
      ]).then(result => Math.round((result[0]?.avgScore || 0) * 100) / 100),
    ]);

    res.status(200).json({
      success: true,
      data: {
        completionRate: Math.round(completionRate * 100) / 100,
        avgTimeSpent,
        avgQuizScore,
      },
    });
  });

  static getAdminSalesAnalytics = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const [
      salesTotals,
      salesByCategory,
      salesBySchool
    ] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
      ]).then(result => result[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'categories',
            localField: 'product.category',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category.name',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        { $match: { 'product.school': { $exists: true } } },
        {
          $lookup: {
            from: 'schools',
            localField: 'product.school',
            foreignField: '_id',
            as: 'school',
          },
        },
        { $unwind: '$school' },
        {
          $group: {
            _id: '$school.name',
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totals: salesTotals,
        byCategory: salesByCategory,
        bySchool: salesBySchool,
      },
    });
  });

  static getTeacherAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const teacherId = req.user._id;

    const [
      contentStats,
      engagementStats
    ] = await Promise.all([
      Content.aggregate([
        { $match: { uploaderId: new mongoose.Types.ObjectId(teacherId), isDeleted: false } },
        {
          $group: {
            _id: null,
            totalContent: { $sum: 1 },
            approved: { 
              $sum: { 
                $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] 
              } 
            },
            pending: { 
              $sum: { 
                $cond: [{ $eq: ['$approvalStatus', 'pending'] }, 1, 0] 
              } 
            },
            rejected: { 
              $sum: { 
                $cond: [{ $eq: ['$approvalStatus', 'rejected'] }, 1, 0] 
              } 
            },
          },
        },
      ]).then(result => result[0] || { totalContent: 0, approved: 0, pending: 0, rejected: 0 }),
      Progress.aggregate([
        {
          $lookup: {
            from: 'contents',
            localField: 'contentId',
            foreignField: '_id',
            as: 'content',
          },
        },
        { $unwind: '$content' },
        { $match: { 'content.uploaderId': new mongoose.Types.ObjectId(teacherId) } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: 1 },
            completions: { 
              $sum: { 
                $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] 
              } 
            },
            avgTimeSpent: { $avg: '$timeSpent' },
            avgQuizScore: { $avg: '$quizScore' },
          },
        },
      ]).then(result => result[0] || { totalViews: 0, completions: 0, avgTimeSpent: 0, avgQuizScore: 0 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        content: contentStats,
        engagement: {
          ...engagementStats,
          avgTimeSpent: Math.round(engagementStats.avgTimeSpent || 0),
          avgQuizScore: Math.round((engagementStats.avgQuizScore || 0) * 100) / 100,
          completionRate: contentStats.totalContent > 0 
            ? Math.round((engagementStats.completions / engagementStats.totalViews) * 100 * 100) / 100
            : 0,
        },
      },
    });
  });
}