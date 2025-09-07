import { Request, Response, NextFunction } from 'express';
import { verifyToken, verifyAdminToken } from '../utils/jwt';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { UserRole } from '../types';
import { User } from '../models/User';
import { Admin } from '../models/Admin';

export interface AuthenticatedRequest extends Request {
  user?: any;
  admin?: any;
}

export const requireAnyAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new AuthenticationError('No token provided');

    // Try user token first
    try {
      const decodedUser = verifyToken(token);
      const user = await User.findById(decodedUser.userId).select('-__v');
      if (user) {
        req.user = user;
        return next();
      }
    } catch (_) {
      // ignore and try admin
    }

    // Try admin token
    try {
      const decodedAdmin = verifyAdminToken(token);
      const admin = await Admin.findById(decodedAdmin.adminId).select('-password -__v');
      if (admin) {
        req.admin = admin;
        return next();
      }
    } catch (_) {
      // ignore
    }

    throw new AuthenticationError('Invalid token');
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-__v');

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdminAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyAdminToken(token);
    const admin = await Admin.findById(decoded.adminId).select('-password -__v');

    if (!admin) {
      throw new AuthenticationError('Admin not found');
    }

    req.admin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!req.user || !userRoles.includes(req.user.role)) {
      return next(new AuthorizationError('Insufficient permissions'));
    }
    
    next();
  };
};

export const requireTeacherApproval = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user?.role === 'teacher' && req.user.approvalStatus !== 'approved') {
    return next(new AuthorizationError('Teacher approval required'));
  }
  
  next();
};