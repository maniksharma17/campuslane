import { Progress, IProgress } from '../models/Progress';
import { Content } from '../models/Content';
import { NotFoundError, ValidationError } from '../utils/errors';
import mongoose from 'mongoose';

export class ProgressService {
  static async openContent(studentId: string, contentId: string): Promise<IProgress> {
    // Verify content exists and is approved
    const content = await Content.findOne({ 
      _id: contentId, 
      approvalStatus: 'approved',
      isDeleted: false 
    });

    if (!content) {
      throw new NotFoundError('Content not found or not approved');
    }

    // Find or create progress
    let progress = await Progress.findOne({ studentId, contentId });

    if (!progress) {
      progress = new Progress({
        studentId,
        contentId,
        status: 'in_progress',
      });
    } else if (progress.status === 'not_started') {
      progress.status = 'in_progress';
    }

    await progress.save();
    return progress;
  }

  static async completeContent(
    studentId: string, 
    contentId: string, 
    quizScore?: number
  ): Promise<IProgress> {
    const progress = await Progress.findOne({ studentId, contentId });

    if (!progress) {
      throw new NotFoundError('Progress not found. Please open the content first.');
    }

    progress.status = 'completed';
    progress.completedAt = new Date();
    
    if (quizScore !== undefined) {
      if (quizScore < 0 || quizScore > 100) {
        throw new ValidationError('Quiz score must be between 0 and 100');
      }
      progress.quizScore = quizScore;
    }

    await progress.save();
    return progress;
  }

  static async recordVideoTime(
    studentId: string, 
    contentId: string, 
    secondsSinceLastPing: number
  ): Promise<IProgress> {
    // Clamp the time increment (max 5 minutes between pings)
    const clampedSeconds = Math.min(Math.max(0, secondsSinceLastPing), 300);

    let progress = await Progress.findOne({ studentId, contentId });

    if (!progress) {
      // Auto-create progress if not exists
      progress = new Progress({
        studentId,
        contentId,
        status: 'in_progress',
        timeSpent: clampedSeconds,
      });
    } else {
      progress.timeSpent += clampedSeconds;
      if (progress.status === 'not_started') {
        progress.status = 'in_progress';
      }
    }

    await progress.save();
    return progress;
  }

  static async getStudentProgress(
    studentId: string,
    filters: {
      classId?: string;
      subjectId?: string;
      page: number;
      limit: number;
    }
  ) {
    const query: any = { studentId };
    const skip = (filters.page - 1) * filters.limit;

    // Build content filter for lookup
    const contentFilter: any = { approvalStatus: 'approved', isDeleted: false };
    if (filters.classId) contentFilter.classId = new mongoose.Types.ObjectId(filters.classId);
    if (filters.subjectId) contentFilter.subjectId = new mongoose.Types.ObjectId(filters.subjectId);

    const [progressData, total] = await Promise.all([
      Progress.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'contents',
            localField: 'contentId',
            foreignField: '_id',
            as: 'content',
          },
        },
        { $unwind: '$content' },
        { $match: { content: contentFilter } },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: filters.limit },
        {
          $project: {
            status: 1,
            timeSpent: 1,
            quizScore: 1,
            completedAt: 1,
            'content.title': 1,
            'content.type': 1,
            'content.classId': 1,
            'content.subjectId': 1,
            'content.chapterId': 1,
          },
        },
      ]),
      Progress.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'contents',
            localField: 'contentId',
            foreignField: '_id',
            as: 'content',
          },
        },
        { $unwind: '$content' },
        { $match: { content: contentFilter } },
        { $count: 'total' },
      ]).then(result => result[0]?.total || 0),
    ]);

    return {
      data: progressData,
      total,
    };
  }
}