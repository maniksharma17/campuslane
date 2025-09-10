import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { User } from "../models/User";
import { Content } from "../models/Content";
import { generatePresignedUrl } from "../config/aws";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError, ValidationError } from "../utils/errors";
import {
  getPaginationParams,
  createPaginationResult,
} from "../utils/pagination";

export class AdminController {
  static getTeachers = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { status, search, page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);

      const filter: any = {
        role: "teacher",
        isDeleted: false,
      };

      if (status) {
        filter.approvalStatus = status;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const [teachers, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
      ]);

      const result = createPaginationResult(teachers, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getTeacherById = asyncHandler(
      async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
  
        const teacher = await User.findById(id);
  
        if (!teacher) {
          throw new NotFoundError("Teacher not found");
        }
  
        res.status(200).json({
          success: true,
          data: teacher,
        });
      }
    );

  static updateTeacher = asyncHandler(
      async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
  
        const teacher = await User.findOneAndUpdate(
          { _id: id, isDeleted: false },
          req.body,
          { new: true, runValidators: true }
        );
  
        if (!teacher) {
          throw new NotFoundError("Teacher not found");
        }
  
        res.status(200).json({
          success: true,
          data: teacher,
        });
      }
    );

  static deleteTeacher = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const teacher = await User.findById(id);
      if (!teacher || teacher.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Soft delete
      teacher.isDeleted = true;
      await teacher.save();

      return res
        .status(200)
        .json({ success: true, message: "Teacher deleted successfully" });
    }
  );

  static approveTeacher = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const teacher = await User.findOneAndUpdate(
        { _id: id, role: "teacher", isDeleted: false },
        { approvalStatus: "approved" },
        { new: true }
      );

      if (!teacher) {
        throw new NotFoundError("Teacher not found");
      }

      res.status(200).json({
        success: true,
        data: teacher,
        message: "Teacher approved successfully",
      });
    }
  );

  static rejectTeacher = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const teacher = await User.findOneAndUpdate(
        { _id: id, role: "teacher", isDeleted: false },
        { approvalStatus: "rejected" },
        { new: true }
      );

      if (!teacher) {
        throw new NotFoundError("Teacher not found");
      }

      res.status(200).json({
        success: true,
        data: teacher,
        message: "Teacher rejected successfully",
      });
    }
  );

  static getContentForApproval = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const {
        approvalStatus,
        classId,
        subjectId,
        chapterId,
        q,
        page,
        limit,
        includeDeleted,
      } = req.query as any;

      const { skip } = getPaginationParams(req.query);

      const filter: any = {};

      if (!includeDeleted) {
        filter.isDeleted = false;
      }

      if (approvalStatus) filter.approvalStatus = approvalStatus;
      if (classId) filter.classId = classId;
      if (subjectId) filter.subjectId = subjectId;
      if (chapterId) filter.chapterId = chapterId;

      if (q) {
        filter.$text = { $search: q };
      }

      const [content, total] = await Promise.all([
        Content.find(filter)
          .populate("classId", "name")
          .populate("subjectId", "name")
          .populate("chapterId", "name")
          .populate("uploaderId", "name email")
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
    }
  );

  static approveContent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const content = await Content.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { approvalStatus: "approved" },
        { new: true }
      );

      if (!content) {
        throw new NotFoundError("Content not found");
      }

      res.status(200).json({
        success: true,
        data: content,
        message: "Content approved successfully",
      });
    }
  );

  static rejectContent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const content = await Content.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { approvalStatus: "rejected" },
        { new: true }
      );

      if (!content) {
        throw new NotFoundError("Content not found");
      }

      res.status(200).json({
        success: true,
        data: content,
        message: "Content rejected successfully",
      });
    }
  );

  static getStudents = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { search, page, limit } = req.query as any;
      const { skip } = getPaginationParams(req.query);

      const filter: any = {
        role: "student",
        isDeleted: false,
      };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const [students, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments(filter),
      ]);

      const result = createPaginationResult(students, total, page, limit);

      res.status(200).json({
        success: true,
        ...result,
      });
    }
  );

  static getStudentById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const {id} = req.params;

      const student = await User.findById(id);

      res.status(200).json({
        success: true,
        data: student
      });
    }
  );

  static updateStudent = asyncHandler(
      async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params;
  
        const student = await User.findOneAndUpdate(
          { _id: id, isDeleted: false },
          req.body,
          { new: true, runValidators: true }
        );
  
        if (!student) {
          throw new NotFoundError("Student not found");
        }
  
        res.status(200).json({
          success: true,
          data: student,
        });
      }
    );

  static deleteStudent = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const student = await User.findById(id);
      if (!student || student.isDeleted) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Soft delete
      student.isDeleted = true;
      await student.save();

      return res
        .status(200)
        .json({ success: true, message: "Student deleted successfully" });
    }
  );

  static generatePresignedUrl = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { fileName, contentType } = req.body;

      // Validate content type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      if (!allowedTypes.includes(contentType)) {
        throw new ValidationError("Unsupported file type");
      }

      // Generate unique key
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const key = `uploads/${timestamp}-${randomString}-${fileName}`;

      const presignedData = await generatePresignedUrl(key, contentType);

      res.status(200).json({
        success: true,
        data: presignedData,
      });
    }
  );
}
