import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { ProgressService } from "../services/ProgressService";
import { ParentChildLink } from "../models/ParentChildLink";
import { Progress } from "../models/Progress";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthorizationError, NotFoundError } from "../utils/errors";
import { Content } from "../models/Content";
import mongoose from "mongoose";

export class ProgressController {
  static openContent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { contentId } = req.body;
      const studentId = req.user._id;

      const progress = await ProgressService.openContent(studentId, contentId);

      res.status(200).json({
        success: true,
        data: progress,
      });
    }
  );

  static getMyProgress = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const studentId = req.user?._id;
      if (!studentId)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });

      const { classId, subjectId } = req.query as any;
      const recentLimit = Math.max(0, Number(req.query.recentLimit ?? 10));
      const watchLimit = Math.max(0, Number(req.query.watchLimit ?? 50));

      const result = await ProgressService.getStudentProgress(
        studentId,
        recentLimit,
        watchLimit,
        classId,
        subjectId
      );

      return res.status(200).json({
        ...result,
      });
    }
  );

  static completeContent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { contentId, quizScore } = req.body;
      const studentId = req.user._id.toString();

      const progress = await ProgressService.completeContent(
        studentId,
        contentId,
        quizScore
      );

      res.status(200).json({
        success: true,
        data: progress,
      });
    }
  );

  static recordVideoTime = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { contentId, secondsSinceLastPing } = req.body;
      const studentId = req.user._id;

      if (!contentId || typeof secondsSinceLastPing !== "number") {
        return res
          .status(400)
          .json({ message: "Missing contentId or secondsSinceLastPing" });
      }

      const clampedSeconds = Math.min(Math.max(0, secondsSinceLastPing), 300);
      const now = new Date();

      let progress = await Progress.findOne({ studentId, contentId });

      if (!progress) {
        progress = new Progress({
          studentId,
          contentId,
          status: "in_progress",
          timeSpent: clampedSeconds,
          lastWatchedSecond: clampedSeconds,
          progressPercent: 0,
          watchSessions: [{ startedAt: now, duration: clampedSeconds }],
        });
      } else {
        progress.timeSpent += clampedSeconds;
        progress.lastWatchedSecond += clampedSeconds;

        // Append to watchSessions
        if (!progress.watchSessions) progress.watchSessions = [];
        progress.watchSessions.push({
          startedAt: now,
          duration: clampedSeconds,
        });

        // Calculate progressPercent based on content duration
        const content = await Content.findById(contentId);
        if (content?.duration) {
          progress.progressPercent = Math.min(
            (progress.timeSpent / content.duration) * 100,
            100
          );
        }

        // Update status
        if (progress.progressPercent === 100) {
          progress.status = "completed";
          progress.completedAt = now;
        } else if (
          progress.progressPercent > 0 &&
          progress.status === "not_started"
        ) {
          progress.status = "in_progress";
        }
      }

      await progress.save();

      return res.status(200).json({
        success: true,
        data: progress,
      });
    }
  );

  static getRecentlyVisited = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const studentId = req.user._id as mongoose.Types.ObjectId;
      const limit =
        req.query.limit && !isNaN(Number(req.query.limit))
          ? Number(req.query.limit)
          : 10;

      const results = await Progress.find({ studentId })
        .sort({ updatedAt: -1 }) // most recently updated
        .limit(limit)
        .select("contentId contentSnapshot status progressPercent updatedAt")
        .populate("contentId", "title type thumbnailKey s3Key") // join with Content model
        .lean();

      res.status(200).json({
        success: true,
        data: results,
      });
    }
  );

  static getContentProgress = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const studentId = req.user._id.toString();

      const progress = await Progress.find({
        contentId: id,
        studentId,
      });

      res.status(200).json({
        success: true,
        data: progress,
      });
    }
  );

  static getChildProgress = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { studentId } = req.params;
      const parentId = req.user._id;

      // Verify parent-child link
      const link = await ParentChildLink.findOne({
        parentId,
        studentId,
        status: "approved",
      });

      if (!link) {
        throw new AuthorizationError(
          "You do not have permission to view this child's progress"
        );
      }

      const recentLimit = Math.max(0, Number(req.query.recentLimit ?? 10));
      const watchLimit = Math.max(0, Number(req.query.watchLimit ?? 50));

      const result = await ProgressService.getStudentProgress(
        studentId,
        recentLimit,
        watchLimit
      );

      return res.status(200).json({
        ...result,
      });
    }
  );

  static deleteProgress = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const progress = await Progress.findByIdAndDelete(id);

      if (!progress) {
        throw new NotFoundError("Progress record not found");
      }

      res.status(200).json({
        success: true,
        message: "Progress record deleted successfully",
      });
    }
  );
}
