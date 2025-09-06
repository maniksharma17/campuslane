import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/errors';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class NotificationController {
  static getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit } = req.query as any;
    const { skip } = getPaginationParams(req.query);
    const userId = req.user._id;

    const filter = { 
      userId, 
      isDeleted: false 
    };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    const result = createPaginationResult(notifications, total, page, limit);

    res.status(200).json({
      success: true,
      ...result,
    });
  });

  static markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  });

  static deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      { 
        isDeleted: true, 
        deletedAt: new Date(),
        deletedBy: userId 
      },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  });
}