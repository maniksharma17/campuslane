import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ParentChildLink } from '../models/ParentChildLink';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, ValidationError } from '../utils/errors';
import { NotificationService } from '../services/NotificationService';
import mongoose from 'mongoose';

export class ParentChildController {
  static createLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { childId, studentCode } = req.body;
  const parentId = req.user._id;

  let child;

  if (childId) {
    child = await User.findOne({ _id: childId, role: "student", isDeleted: false }).select("name age grade studentCode");
  } else if (studentCode) {
    child = await User.findOne({ studentCode, role: "student", isDeleted: false }).select("name age grade studentCode");
  } else {
    throw new ValidationError("Either childId or studentCode is required");
  }

  if (!child) {
    throw new NotFoundError("Student not found");
  }

  // Check if link already exists
  const existingLink = await ParentChildLink.findOne({
    parentId,
    studentId: child._id,
  });

  if (existingLink) {
    if (existingLink.status === "approved") {
      throw new ValidationError("Link already exists and is approved");
    } else if (existingLink.status === "pending") {
      throw new ValidationError("Link request is already pending");
    } else {
      // Rejected - allow new request
      existingLink.status = "pending";
      existingLink.requestedAt = new Date();
      existingLink.respondedAt = undefined;
      await existingLink.save();

      await NotificationService.notifyParentLinkRequest(
        child._id as mongoose.Types.ObjectId,
        req.user.name,
        existingLink._id as mongoose.Types.ObjectId
      );

      return res.status(200).json({
        success: true,
        data: {
          link: existingLink,
          student: {
            name: child.name,
            age: child.age,
            studentCode: child.studentCode,
          },
        },
        message: "Link request sent again",
      });
    }
  } else {
    // Create new link request
    const link = new ParentChildLink({
      parentId,
      studentId: child._id,
      studentCode: child.studentCode,
      status: "pending",
      requestedAt: new Date(),
    });

    await link.save();

    await NotificationService.notifyParentLinkRequest(
      child._id as mongoose.Types.ObjectId,
      req.user.name,
      link._id as mongoose.Types.ObjectId
    );

    return res.status(201).json({
      success: true,
      data: {
        link,
        student: {
          name: child.name,
          age: child.age,
          studentCode: child.studentCode,
        },
      },
      message: "Link request sent successfully",
    });
  }
});

  static getPendingLinks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const studentId = req.user._id;

    const links = await ParentChildLink.find({
      studentId,
      status: 'pending',
    }).populate('parentId', 'name email phone');

    res.status(200).json({
      success: true,
      data: links,
    });
  });

  static approveLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const studentId = req.user._id;

    const link = await ParentChildLink.findOne({
      _id: id,
      studentId,
      status: 'pending',
    });

    if (!link) {
      throw new NotFoundError('Link request not found');
    }

    link.status = 'approved';
    link.respondedAt = new Date();
    await link.save();

    res.status(200).json({
      success: true,
      data: link,
      message: 'Link approved successfully',
    });
  });

  static rejectLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const childId = req.user._id;

    const link = await ParentChildLink.findOne({
      _id: id,
      childId,
      status: 'pending',
    });

    if (!link) {
      throw new NotFoundError('Link request not found');
    }

    link.status = 'rejected';
    link.respondedAt = new Date();
    await link.save();

    res.status(200).json({
      success: true,
      data: link,
      message: 'Link rejected successfully',
    });
  });

  static deleteLink = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const childId = req.user._id;

    const link = await ParentChildLink.findOneAndDelete({
      _id: id,
      childId,
    });

    if (!link) {
      throw new NotFoundError('Link not found');
    }

    res.status(200).json({
      success: true,
      message: 'Link deleted successfully',
    });
  });

  static getParentLinks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parentId = req.user._id;

    const links = await ParentChildLink.find({
      parentId,
      status: 'approved',
    }).populate('childId', 'name email age studentCode');

    res.status(200).json({
      success: true,
      data: links,
    });
  });
}