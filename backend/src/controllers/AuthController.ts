import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { Admin } from "../models/Admin";
import { generateToken, generateAdminToken } from "../utils/jwt";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticationError } from "../utils/errors";
import { UserRole } from "../types";

export class AuthController {
  static googleSignIn = asyncHandler(async (req: Request, res: Response) => {
    const { idToken, role, name, phone, city, state, country, pincode, age } =
      req.body;

    const user = (await UserService.findOrCreateFromGoogle(
      name,
      idToken,
      phone,
      city,
      state,
      country,
      pincode,
      role as UserRole,
      age
    )) as {
      name: string;
      _id: string | { toString(): string };
      role: UserRole;
      phone: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
    };

    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        user,
      },
    });
  });

  static adminLogin = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email }).select("+password");

    if (!admin || !(await admin.comparePassword(password))) {
      throw new AuthenticationError("Invalid email or password");
    }

    const token = generateAdminToken({
      adminId: (admin._id as string | { toString(): string }).toString(),
    });

    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      },
    });
  });
}
