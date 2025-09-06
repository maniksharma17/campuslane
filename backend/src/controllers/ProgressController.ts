import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ProgressService } from '../services/ProgressService';
import { ParentChildLink } from '../models/ParentChildLink';
import { Progress } from '../models/Progress';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { createPaginationResult } from '../utils/pagination';

export class ProgressController {
  static openContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { contentId } = req.body;
    const studentId = req.user._id.toString();

    const progress = await ProgressService.openContent(studentId, contentId);

    res.status(200).json({
      success: true,
      data: progress,
    });
  });

  static completeContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { contentId, quizScore } = req.body;
    const studentId = req.user._id.toString();

    const progress = await ProgressService.completeContent(studentId, contentId, quizScore);

    res.status(200).json({
      success: true,
      data: progress,
    });
  });

  static recordVideoTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { contentId, secondsSinceLastPing } = req.body;
    const studentId = req.user._id.toString();

    const progress = await ProgressService.recordVideoTime(studentId, contentId, secondsSinceLastPing);

    res.status(200).json({
      success: true,
      data: progress,
    });
  });

  static getMyProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { classId, subjectId, page, limit } = req.query as any;
    const studentId = req.user._id.toString();

    const result = await ProgressService.getStudentProgress(studentId, {
      classId,
      subjectId,
      page,
      limit,
    });

    const paginationResult = createPaginationResult(result.data, result.total, page, limit);

    res.status(200).json({
      success: true,
      ...paginationResult,
    });
  });

  static getChildProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { childId } = req.params;
    const { classId, subjectId, page, limit } = req.query as any;
    const parentId = req.user._id.toString();

    // Verify parent-child link
    const link = await ParentChildLink.findOne({
      parentId,
      childId,
      status: 'approved',
    });

    if (!link) {
      throw new AuthorizationError('You do not have permission to view this child\'s progress');
    }

    const result = await ProgressService.getStudentProgress(childId, {
      classId,
      subjectId,
      page,
      limit,
    });

    const paginationResult = createPaginationResult(result.data, result.total, page, limit);

    res.status(200).json({
      success: true,
      ...paginationResult,
    });
  });

  static deleteProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const progress = await Progress.findByIdAndDelete(id);

    if (!progress) {
      throw new NotFoundError('Progress record not found');
    }

    res.status(200).json({
      success: true,
      message: 'Progress record deleted successfully',
    });
  });
}