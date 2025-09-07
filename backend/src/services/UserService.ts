import { User, IUser } from "../models/User";
import { generateStudentCode } from "../utils/generateCode";
import { UserRole } from "../types";
import { NotificationService } from "./NotificationService";
import { Types } from "mongoose";
import axios from "axios";

export class UserService {
  static async findOrCreateFromGoogle(
    name: string,
    token: string,
    phone?: string,
    city?: string,
    state?: string,
    country?: string,
    pincode?: string,
    role?: UserRole,
    age?: number,
    classLevel?: Types.ObjectId,  
    classOther?: string,
  ): Promise<IUser> {
    // Use id_token to fetch profile
    const { data: googleUser } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    let user = await User.findOne({
      $or: [{ email: googleUser.email }, { googleId: googleUser.sub }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        await user.save();
      }
      return user;
    }

    const userData: Partial<IUser> = {
      name,
      email: googleUser.email,
      googleId: googleUser.sub,
      phone,
      pincode,
      city,
      state,
      country,
      role: role || "student",
    };

    if (role === "student") {
      if (age) {
        userData.age = age;
        userData.studentCode = generateStudentCode();
      }

      if (classLevel) {
        userData.classLevel = classLevel;
      }

      if (classOther) {
        userData.classOther = classOther;
      }
    }

    user = new User(userData);
    await user.save();

    if (role === "teacher") {
      await NotificationService.notifyTeacherSignup(
        user._id as Types.ObjectId,
        user.name
      );
    }

    return user;
  }

  static async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  static async updateProfile(
    userId: string,
    updates: Partial<IUser>
  ): Promise<IUser | null> {
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
