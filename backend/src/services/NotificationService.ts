import { Admin } from '../models/Admin';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { UserRole } from '../types';
import mongoose from 'mongoose';

export class NotificationService {
  static async createNotification(data: {
    userId: mongoose.Types.ObjectId;
    role: UserRole;
    type: string;
    title: string;
    body: string;
    meta?: Record<string, any>;
  }) {
    try {
      const notification = new Notification(data);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  static async notifyTeacherSignup(teacherId: mongoose.Types.ObjectId, teacherName: string) {
    const admins = await Admin.find().lean();
    
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      role: 'admin' as UserRole,
      type: 'teacher_signup',
      title: 'New Teacher Registration',
      body: `${teacherName} has signed up as a teacher and is pending approval`,
      meta: { teacherId },
    }));
    console.log(admins)

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  static async notifyContentSubmission(
  contentId: mongoose.Types.ObjectId,
  contentTitle: string
) {
  const admins = await User.find({ role: "admin" }).lean();

  for (const admin of admins) {
    await Notification.findOneAndUpdate(
      {
        userId: admin._id,
        role: "admin",
        "meta.contentId": contentId, 
      },
      {
        $set: {
          type: "content_pending",
          title: "Content Pending Approval",
          body: `Content "${contentTitle}" is pending approval`,
          meta: { contentId },
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  }
}


  static async notifyParentLinkRequest(studentId: mongoose.Types.ObjectId, parentName: string, linkId: mongoose.Types.ObjectId) {
    await this.createNotification({
      userId: studentId,
      role: 'student',
      type: 'parent_link_request',
      title: 'Parent Link Request',
      body: `${parentName} wants to link to your account`,
      meta: { linkId },
    });
  }

  static async notifyOrderStatusUpdate(userId: mongoose.Types.ObjectId, orderId: mongoose.Types.ObjectId, status: string) {
    const user = await User.findById(userId).lean();
    await this.createNotification({
      userId,
      role: (user?.role as UserRole) || 'parent',
      type: 'order_status',
      title: 'Order Update',
      body: `Your order status has been updated to: ${status}`,
      meta: { orderId, status },
    });
  }
}
