export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AdminJwtPayload {
  adminId: string;
  iat?: number;
  exp?: number;
}

export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ContentType = 'file' | 'video' | 'quiz' | 'game' | 'image';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export type PaymentType = 'COD' | 'Razorpay';

export type PaymentStatus = 'pending' | 'success' | 'failed';

export type QuizType = 'googleForm' | 'native';

export type Gender = 'Boys' | 'Girls' | 'Unisex';

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
  q?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}