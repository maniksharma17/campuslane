import { Progress, IProgress } from '../models/Progress';
import { Content } from '../models/Content';
import { NotFoundError, ValidationError } from '../utils/errors';
import mongoose from 'mongoose';

export class ProgressService {
  static async openContent(studentId: mongoose.Types.ObjectId, contentId: string): Promise<IProgress> {
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
      const content = await Content.findById(contentId);
      const contentSnapshot = {
        title: content?.title,
        type: content?.type,
        s3key: content?.s3Key
      }
      progress = new Progress({
        studentId,
        contentId,
        contentSnapshot,
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
    recentLimit: number,
    watchLimit: number,
    classId?: mongoose.Types.ObjectId,
    subjectId?: mongoose.Types.ObjectId
  ) {
    

    // timezone for dateTrunc
    const TZ = "Asia/Kolkata";

    // Build pipeline
    const pipeline: any[] = [];

    // 1) base match by student
    pipeline.push({ $match: { studentId: new mongoose.Types.ObjectId(String(studentId)) } });

    // 2) lookups + unwinds: content, chapter, subject, class
    pipeline.push(
      // content
      {
        $lookup: {
          from: "contents",
          localField: "contentId",
          foreignField: "_id",
          as: "content",
        },
      },
      { $unwind: { path: "$content", preserveNullAndEmptyArrays: true } },

      // chapter
      {
        $lookup: {
          from: "chapters",
          localField: "content.chapterId",
          foreignField: "_id",
          as: "chapter",
        },
      },
      { $unwind: { path: "$chapter", preserveNullAndEmptyArrays: true } },

      // subject
      {
        $lookup: {
          from: "subjects",
          localField: "content.subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },

      // class
      {
        $lookup: {
          from: "classes",
          localField: "content.classId",
          foreignField: "_id",
          as: "class",
        },
      },
      { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } }
    );

    // 3) compute helpers: lastSession (last element), lastWatchedAt, canonical content fields
    pipeline.push({
      $addFields: {
        lastSession: {
          $let: {
            vars: { ws: { $ifNull: ["$watchSessions", []] } },
            in: {
              $cond: [
                { $gt: [{ $size: "$$ws" }, 0] },
                { $arrayElemAt: ["$$ws", { $subtract: [{ $size: "$$ws" }, 1] }] },
                null,
              ],
            },
          },
        },
        lastWatchedAt: {
          $ifNull: [
            "$completedAt",
            { $ifNull: ["$lastSession.startedAt", { $ifNull: ["$updatedAt", "$createdAt"] }] },
          ],
        },
        _contentType: { $ifNull: ["$content.type", "$contentSnapshot.type"] },
        _contentTitle: { $ifNull: ["$content.title", "$contentSnapshot.title"] },
        _contentDuration: { $ifNull: ["$content.duration", "$contentSnapshot.duration"] },
        _classIdFromContent: "$content.classId",
        _subjectIdFromContent: "$content.subjectId",
        _chapterIdFromContent: "$content.chapterId",
      },
    });

    // 4) optional filters by classId / subjectId (compare to populated doc or raw content ids)
    if (classId) {
      pipeline.push({
        $match: {
          $expr: {
            $or: [
              { $eq: ["$class._id", new mongoose.Types.ObjectId(String(classId))] },
              { $eq: ["$_classIdFromContent", new mongoose.Types.ObjectId(String(classId))] },
            ],
          },
        },
      });
    }
    if (subjectId) {
      pipeline.push({
        $match: {
          $expr: {
            $or: [
              { $eq: ["$subject._id", new mongoose.Types.ObjectId(String(subjectId))] },
              { $eq: ["$_subjectIdFromContent", new mongoose.Types.ObjectId(String(subjectId))] },
            ],
          },
        },
      });
    }

    // 5) single facet producing multiple outputs, including weeklyBuckets (last 4 weeks) and monthlyBuckets (last 12 months)
    pipeline.push({
      $facet: {
        // OVERALL + byType
        overall: [
          {
            $group: {
              _id: null,
              totalContents: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
              notStarted: { $sum: { $cond: [{ $eq: ["$status", "not_started"] }, 1, 0] } },

              // by-type totals & completed
              video_total: { $sum: { $cond: [{ $eq: ["$_contentType", "video"] }, 1, 0] } },
              video_completed: { $sum: { $cond: [{ $and: [{ $eq: ["$_contentType", "video"] }, { $eq: ["$status", "completed"] }] }, 1, 0] } },
              video_timeSpent: { $sum: { $cond: [{ $eq: ["$_contentType", "video"] }, { $ifNull: ["$timeSpent", 0] }, 0] } },
              video_sessions: {
                $sum: {
                  $cond: [
                    { $eq: ["$_contentType", "video"] },
                    { $cond: [{ $isArray: "$watchSessions" }, { $size: { $ifNull: ["$watchSessions", []] } }, 0] },
                    0,
                  ],
                },
              },

              file_total: { $sum: { $cond: [{ $eq: ["$_contentType", "file"] }, 1, 0] } },
              file_completed: { $sum: { $cond: [{ $and: [{ $eq: ["$_contentType", "file"] }, { $eq: ["$status", "completed"] }] }, 1, 0] } },

              image_total: { $sum: { $cond: [{ $eq: ["$_contentType", "image"] }, 1, 0] } },
              image_completed: { $sum: { $cond: [{ $and: [{ $eq: ["$_contentType", "image"] }, { $eq: ["$status", "completed"] }] }, 1, 0] } },

              quiz_total: { $sum: { $cond: [{ $eq: ["$_contentType", "quiz"] }, 1, 0] } },
              quiz_completed: { $sum: { $cond: [{ $and: [{ $eq: ["$_contentType", "quiz"] }, { $eq: ["$status", "completed"] }] }, 1, 0] } },
              quiz_score_sum: { $sum: { $cond: [{ $and: [{ $eq: ["$_contentType", "quiz"] }, { $ne: ["$quizScore", null] }] }, "$quizScore", 0] } },
              quiz_score_count: { $sum: { $cond: [{ $and: [{ $eq: ["$_contentType", "quiz"] }, { $ne: ["$quizScore", null] }] }, 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              totalContents: 1,
              completed: 1,
              inProgress: 1,
              notStarted: 1,
              byType: {
                video: {
                  total: "$video_total",
                  completed: "$video_completed",
                  timeSpent: "$video_timeSpent",
                  sessions: "$video_sessions",
                },
                file: { total: "$file_total", completed: "$file_completed" },
                image: { total: "$image_total", completed: "$image_completed" },
                quiz: {
                  total: "$quiz_total",
                  completed: "$quiz_completed",
                  avgScore: {
                    $cond: [{ $gt: ["$quiz_score_count", 0] }, { $divide: ["$quiz_score_sum", "$quiz_score_count"] }, 0],
                  },
                },
              },
            },
          },
        ],

        // CLASSES -> SUBJECTS -> CHAPTERS (nested)
        classes: [
          {
            $group: {
              _id: {
                classId: "$class._id",
                classTitle: "$class.name",
                subjectId: "$subject._id",
                subjectTitle: "$subject.name",
                chapterId: "$chapter._id",
                chapterTitle: "$chapter.name",
              },
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
            },
          },
          {
            $group: {
              _id: { classId: "$_id.classId", classTitle: "$_id.classTitle", subjectId: "$_id.subjectId", subjectTitle: "$_id.subjectTitle" },
              chapters: {
                $push: {
                  chapterId: "$_id.chapterId",
                  title: "$_id.chapterTitle",
                  total: "$total",
                  completed: "$completed",
                  percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$completed", "$total"] }, 100] }, 0] },
                },
              },
              total: { $sum: "$total" },
              completed: { $sum: "$completed" },
            },
          },
          {
            $group: {
              _id: { classId: "$_id.classId", classTitle: "$_id.classTitle" },
              subjects: {
                $push: {
                  subjectId: "$_id.subjectId",
                  title: "$_id.subjectTitle",
                  total: "$total",
                  completed: "$completed",
                  percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$completed", "$total"] }, 100] }, 0] },
                  chapters: "$chapters",
                },
              },
              total: { $sum: "$total" },
              completed: { $sum: "$completed" },
            },
          },
          {
            $project: {
              _id: 0,
              classId: "$_id.classId",
              title: "$_id.classTitle",
              total: 1,
              completed: 1,
              percentage: { $cond: [{ $gt: ["$total", 0] }, { $multiply: [{ $divide: ["$completed", "$total"] }, 100] }, 0] },
              subjects: 1,
            },
          },
        ],

        // RECENT (most recently completed/updated)
        recent: [
          {
            $project: {
              contentId: "$content._id",
              title: "$_contentTitle",
              type: "$_contentType",
              image: "$content.thumbnailKey",
              completedAt: "$completedAt",
              updatedAt: "$updatedAt",
              quizScore: "$quizScore",
              lastWatchedAt: "$lastWatchedAt",
            },
          },
          { $sort: { completedAt: -1, updatedAt: -1 } },
          { $limit: recentLimit },
        ],

        // WATCH HISTORY: recent watched videos
        watchHistory: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_contentType", "video"] },
                  {
                    $or: [
                      { $gt: ["$timeSpent", 0] },
                      { $gt: [{ $size: { $ifNull: ["$watchSessions", []] } }, 0] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              contentId: "$content._id",
              image: "$content.thumbnailKey",
              title: "$_contentTitle",
              durationSeconds: "$_contentDuration",
              watchedSeconds: { $ifNull: ["$timeSpent", 0] },
              progress: { $ifNull: ["$progressPercent", { $cond: [{ $eq: ["$status", "completed"] }, 100, 0] }] },
              lastWatchedAt: "$lastWatchedAt",
            },
          },
          { $sort: { lastWatchedAt: -1 } },
          { $limit: watchLimit },
        ],

        // WEEKLY BUCKETS — lastWatchedAt truncated to week (most recent first), limit 4
        weeklyBuckets: [
          {
            $match: { $expr: { $ne: ["$lastWatchedAt", null] } }, // only docs with a usable date
          },
          {
            $group: {
              _id: {
                $dateTrunc: { date: "$lastWatchedAt", unit: "week", timezone: TZ },
              },
              completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              timeSpentSeconds: { $sum: { $cond: [{ $eq: ["$_contentType", "video"] }, { $ifNull: ["$timeSpent", 0] }, 0] } },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 4 },
          { $project: { _id: 0, weekStart: "$_id", completedCount: 1, timeSpentSeconds: 1 } },
        ],

        // MONTHLY BUCKETS — truncate to month, most recent first, limit 12
        monthlyBuckets: [
          {
            $match: { $expr: { $ne: ["$lastWatchedAt", null] } },
          },
          {
            $group: {
              _id: { $dateTrunc: { date: "$lastWatchedAt", unit: "month", timezone: TZ } },
              completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
              timeSpentSeconds: { $sum: { $cond: [{ $eq: ["$_contentType", "video"] }, { $ifNull: ["$timeSpent", 0] }, 0] } },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 12 },
          { $project: { _id: 0, monthStart: "$_id", completedCount: 1, timeSpentSeconds: 1 } },
        ],
      },
    });

    // run aggregation
    const aggResult = (await Progress.aggregate(pipeline).allowDiskUse(true).exec()) as any[];
    const faceted = aggResult?.[0] || {};

    // parse overall
    const overallRaw = (faceted.overall && faceted.overall[0]) || {
      totalContents: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      byType: { video: { total: 0, completed: 0, timeSpent: 0, sessions: 0 }, file: { total: 0, completed: 0 }, image: { total: 0, completed: 0 }, quiz: { total: 0, completed: 0, avgScore: 0 } },
    };

    // compute overall percent
    const overall = {
      totalContents: overallRaw.totalContents || 0,
      completed: overallRaw.completed || 0,
      inProgress: overallRaw.inProgress || 0,
      notStarted: overallRaw.notStarted || 0,
      percentage: overallRaw.totalContents ? Math.round((overallRaw.completed / overallRaw.totalContents) * 1000) / 10 : 0,
    };

    // shape byType (already in overallRaw.byType if present)
    const byType = overallRaw.byType || {
      video: { total: 0, completed: 0, timeSpent: 0, sessions: 0 },
      file: { total: 0, completed: 0 },
      image: { total: 0, completed: 0 },
      quiz: { total: 0, completed: 0, avgScore: 0 },
    };

    // classes
    const classesOut = (faceted.classes || []).map((c: any) => {
      // round percentages to 1 decimal place
      c.percentage = Math.round((c.percentage || 0) * 10) / 10;
      c.subjects = (c.subjects || []).map((s: any) => {
        s.percentage = Math.round((s.percentage || 0) * 10) / 10;
        s.chapters = (s.chapters || []).map((ch: any) => {
          ch.percentage = Math.round((ch.percentage || 0) * 10) / 10;
          return ch;
        });
        return s;
      });
      return c;
    });

    // recent & watchHistory
    const recent = faceted.recent || [];
    const watchHistory = (faceted.watchHistory || []).map((w: any) => ({ ...w, progress: Math.round((w.progress || 0) * 10) / 10 }));

    // weekly & monthly buckets - convert date objects to ISO strings (or keep Date objects if preferred)
    const weekly = (faceted.weeklyBuckets || []).map((b: any) => ({
      weekStart: b.weekStart ? new Date(b.weekStart).toISOString() : null,
      completedCount: b.completedCount || 0,
      timeSpentSeconds: b.timeSpentSeconds || 0,
    }));

    const monthly = (faceted.monthlyBuckets || []).map((b: any) => ({
      monthStart: b.monthStart ? new Date(b.monthStart).toISOString() : null,
      completedCount: b.completedCount || 0,
      timeSpentSeconds: b.timeSpentSeconds || 0,
    }));

    return ({
      success: true,
      overall,
      byType,
      weekly,    // array of up to 4 items (most-recent-first)
      monthly,   // array of up to 12 items (most-recent-first)
      classes: classesOut,
      recent,
      watchHistory,
    });
  }
}