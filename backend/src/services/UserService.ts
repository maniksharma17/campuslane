import { User, IUser } from '../models/User';
import { verifyGoogleToken } from '../utils/google';
import { generateStudentCode } from '../utils/generateCode';
import { UserRole } from '../types';
import { NotificationService } from './NotificationService';

export class UserService {
  static async findOrCreateFromGoogle(
    idToken: string,
    role?: UserRole,
    age?: number
  ): Promise<IUser> {
    const googleUser = await verifyGoogleToken(idToken);

    let user = await User.findOne({ 
      $or: [
        { email: googleUser.email },
        { googleId: googleUser.sub }
      ]
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        await user.save();
      }
      return user;
    }

    // Create new user
    const userData: Partial<IUser> = {
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.sub,
      avatar: googleUser.picture,
      role: role || 'student',
    };

    if (role === 'student' && age) {
      userData.age = age;
      userData.studentCode = generateStudentCode();
    }

    user = new User(userData);
    await user.save();

    // Notify admins if new teacher
    if (role === 'teacher') {
      await NotificationService.notifyTeacherSignup(
        new (require('mongoose').Types.ObjectId)(user._id),
        user.name
      );
    }

    return user;
  }

  static async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  static async updateProfile(userId: string, updates: Partial<IUser>): Promise<IUser | null> {
    // Remove fields that shouldn't be updated directly
    const allowedUpdates = { ...updates };
    delete allowedUpdates.email;
    delete allowedUpdates.googleId;
    delete allowedUpdates.role;
    delete allowedUpdates.studentCode;
    delete allowedUpdates.approvalStatus;

    return User.findByIdAndUpdate(userId, allowedUpdates, { new: true });
  }
}