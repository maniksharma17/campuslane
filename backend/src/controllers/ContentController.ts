import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { Chapter } from '../models/Chapter';
import { Content } from '../models/Content';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { NotificationService } from '../services/NotificationService';
import mongoose from 'mongoose';

export class ContentController {
  // Classes
  static getClasses = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const classes = await Class.find({ isDeleted: false }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: classes,
    });
  });

  static createClass = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const classData = new Class(req.body);
    await classData.save();

    res.status(201).json({
      success: true,
      data: classData,
    });
  });

  static updateClass = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const classData = await Class.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!classData) {
      throw new NotFoundError('Class not found');
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  });

  static deleteClass = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const classData = await Class.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: req.user?._id || req.admin?._id 
      },
      { new: true }
    );

    if (!classData) {
      throw new NotFoundError('Class not found');
    }

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  });

  // Subjects
  static getSubjects = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { classId } = req.query;
    const filter: any = { isDeleted: false };
    
    if (classId) {
      filter.classId = classId;
    }

    const subjects = await Subject.find(filter);
        
    res.status(200).json({
      success: true,
      data: subjects,
    });
  });

  static createSubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const subject = new Subject(req.body);
    await subject.save();

    res.status(201).json({
      success: true,
      data: subject,
    });
  });

  static updateSubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const subject = await Subject.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  });

  static deleteSubject = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const subject = await Subject.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: req.user?._id || req.admin?._id 
      },
      { new: true }
    );

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  });

  // Chapters
  static getChapters = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subjectId } = req.query;
    const filter: any = { isDeleted: false };
    
    if (subjectId) {
      filter.subjectId = subjectId;
    }

    const chapters = await Chapter.find(filter);
        
    res.status(200).json({
      success: true,
      data: chapters,
    });
  });

  static createChapter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const chapter = new Chapter(req.body);
    await chapter.save();

    res.status(201).json({
      success: true,
      data: chapter,
    });
  });

  static updateChapter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const chapter = await Chapter.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!chapter) {
      throw new NotFoundError('Chapter not found');
    }

    res.status(200).json({
      success: true,
      data: chapter,
    });
  });

  static deleteChapter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const chapter = await Chapter.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: req.user?._id || req.admin?._id 
      },
      { new: true }
    );

    if (!chapter) {
      throw new NotFoundError('Chapter not found');
    }

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  });

  // Content
  static getContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { 
      classId, 
      subjectId, 
      chapterId, 
      type, 
      approvalStatus, 
      q, 
      page, 
      limit,
      includeDeleted 
    } = req.query as any;
    
    const { skip } = getPaginationParams(req.query);
    
    const filter: any = {};
    
    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    if (chapterId) filter.chapterId = chapterId;
    if (type) filter.type = type;
    
    // Handle approval status filter based on user role
    if (req.user?.role === 'student' || req.user?.role === 'parent') {
      filter.approvalStatus = 'approved';
    } else if (approvalStatus) {
      filter.approvalStatus = approvalStatus;
    }

    // Add text search
    if (q) {
      filter.$text = { $search: q };
    }

    const [content, total] = await Promise.all([
      Content.find(filter)
        .populate('classId', 'name')
        .populate('subjectId', 'name')
        .populate('chapterId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Content.countDocuments(filter),
    ]);

    const result = createPaginationResult(content, total, page, limit);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  static getContentById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const content = await Content.findOne({ _id: id, isDeleted: false })
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .populate('chapterId', 'name')
      .populate('uploaderId', 'name email');

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    // Check permissions
    if (req.user?.role === 'student' || req.user?.role === 'parent') {
      if (content.approvalStatus !== 'approved') {
        throw new NotFoundError('Content not found');
      }
    } else if (req.user?.role === 'teacher') {
      if (content.uploaderId.toString() !== req.user._id.toString() && content.approvalStatus !== 'approved') {
        throw new NotFoundError('Content not found');
      }
    }

    res.status(200).json({
      success: true,
      data: content,
    });
  });

  static createContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const contentData = {
      ...req.body,
      uploaderId: req.user?._id || req.admin?._id,
      uploaderRole: req.user?.role || 'admin',
    };

    const content = new Content(contentData);
    await content.save();

    // Notify admins if teacher uploaded content
    if (req.user?.role === 'teacher') {
      await NotificationService.notifyContentSubmission(content._id as mongoose.Types.ObjectId, content.title);
    }

    res.status(201).json({
      success: true,
      data: content,
    });
  });

  static updateContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const content = await Content.findOne({ _id: id, isDeleted: false });
    
    if (!content) {
      throw new NotFoundError('Content not found');
    }

    // Check permissions
    if (req.user?.role === 'teacher') {
      // Teachers can only edit their own content and only if it's pending
      if (content.uploaderId.toString() !== req.user._id.toString()) {
        throw new AuthorizationError('You can only edit your own content');
      }
      if (content.approvalStatus === 'approved') {
        throw new AuthorizationError('Cannot edit approved content');
      }
    }

    Object.assign(content, req.body);
    await content.save();

    res.status(200).json({
      success: true,
      data: content,
    });
  });

  static deleteContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const content = await Content.findOne({ _id: id, isDeleted: false });
    
    if (!content) {
      throw new NotFoundError('Content not found');
    }

    // Check permissions
    if (req.user?.role === 'teacher') {
      // Teachers can only delete their own content and only if it's pending
      if (content.uploaderId.toString() !== req.user._id.toString()) {
        throw new AuthorizationError('You can only delete your own content');
      }
      if (content.approvalStatus !== 'pending') {
        throw new AuthorizationError('Can only delete pending content');
      }
    }

    content.isDeleted = true;
    content.deletedAt = new Date();
    content.deletedBy = req.user?._id || req.admin?._id;
    await content.save();

    res.status(200).json({
      success: true,
      message: 'Content deleted successfully',
    });
  });
}