import { Notification } from '../models/Notification';
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
    }
  }

  static async notifyTeacherSignup(teacherId: mongoose.Types.ObjectId, teacherName: string) {
    // Notify all admins about new teacher signup
    const admins = await mongoose.connection.db.collection('users').find({ role: 'admin' }).toArray();
    
    const notifications = admins.map(admin => ({
      userId: new mongoose.Types.ObjectId(admin._id),
      role: 'admin' as UserRole,
      type: 'teacher_signup',
      title: 'New Teacher Registration',
      body: `${teacherName} has signed up as a teacher and is pending approval`,
      meta: { teacherId },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  static async notifyContentSubmission(contentId: mongoose.Types.ObjectId, contentTitle: string) {
    const admins = await mongoose.connection.db.collection('users').find({ role: 'admin' }).toArray();
    
    const notifications = admins.map(admin => ({
      userId: new mongoose.Types.ObjectId(admin._id),
      role: 'admin' as UserRole,
      type: 'content_pending',
      title: 'Content Pending Approval',
      body: `New content "${contentTitle}" is pending approval`,
      meta: { contentId },
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
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
    await this.createNotification({
      userId,
      role: 'parent', // Assuming parents make orders
      type: 'order_status',
      title: 'Order Update',
      body: `Your order status has been updated to: ${status}`,
      meta: { orderId, status },
    });
  }
}