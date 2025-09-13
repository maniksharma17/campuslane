import axios from "axios";
import { useAuthStore } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const auth = localStorage.getItem("admin-auth");
    if (auth) {
      const parsed = JSON.parse(auth);
      if (parsed?.state?.token) {
        console.log(parsed.state.token);
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    }
  }
  return config;
});

// Response interceptor for error handling

// Auth API
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post("/auth/admin/login", credentials),

  getCurrentUser: () => api.get("/admin/me"),
};

// Education API
export const educationApi = {
  // Classes
  getClasses: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/classes", { params }),

  getClassById: (id: string) => api.get(`/classes/${id}`),




  createClass: (data: {
    name: string;
    description?: string;
    thumbnailKey?: string;
  }) => api.post("/classes", data),

  updateClass: (id: string, data: { name: string; description?: string }) =>
    api.patch(`/classes/${id}`, data),

  deleteClass: (id: string) => api.delete(`/classes/${id}`),

  // Subjects
  getSubjects: (params?: {
    classId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/subjects", { params }),

  getSubjectById: (id: string) => api.get(`/subjects/${id}`),

  createSubject: (data: {
    name: string;
    description?: string;
    classId: string;
  }) => api.post("/subjects", data),

  updateSubject: (
    id: string,
    data: {
      name: string;
      description?: string;
      classId: string;
      thumbnailKey?: string;
    }
  ) => api.patch(`/subjects/${id}`, data),

  deleteSubject: (id: string) => api.delete(`/subjects/${id}`),

  // Chapters
  getChapters: (params?: {
    subjectId?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/chapters", { params }),

  getChapterById: (id: string) => api.get(`/chapters/${id}`),

  createChapter: (data: {
    name: string;
    description?: string;
    subjectId: string;
    order?: number;
  }) => api.post("/chapters", data),

  updateChapter: (
    id: string,
    data: {
      name: string;
      description?: string;
      subjectId: string;
      order?: number;
    }
  ) => api.patch(`/chapters/${id}`, data),

  deleteChapter: (id: string) => api.delete(`/chapters/${id}`),

  // Content
  getContent: (params?: {
    classId?: string;
    subjectId?: string;
    chapterId?: string;
    type?: string;
    approvalStatus?: string;
    isAdminContent?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get("/content", { params }),

  getContentById: (id: string) => api.get(`/content/${id}`),

  createContent: (data: any) => api.post("/content", data),

  updateContent: (id: string, data: any) => api.patch(`/content/${id}`, data),

  deleteContent: (id: string) => api.delete(`/content/${id}`),

  approveContent: (id: string) => api.patch(`/admin/content/${id}/approve`),

  rejectContent: (id: string, reason?: string) =>
    api.patch(`/admin/content/${id}/reject`, { reason }),

  bulkApproveContent: (ids: string[]) =>
    api.post("/admin/content/bulk-approve", { ids }),

  bulkRejectContent: (ids: string[], reason?: string) =>
    api.post("/admin/content/bulk-reject", { ids, reason }),
};

// Users API
export const usersApi = {
  getTeachers: (params?: {
    approvalStatus?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/admin/teachers", { params }),

  getTeacherById: (id: string) => api.get(`/admin/teachers/${id}`),

  updateTeacher: (id: string, data: any) =>
    api.patch(`/admin/teachers/${id}`, data),

  deleteTeacher: (id: string) => api.delete(`/admin/teachers/${id}`),

  getStudents: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/admin/students", { params }),

  updateStudent: (id: string, data: any) =>
    api.patch(`/admin/students/${id}`, data),

  deleteStudent: (id: string) => api.delete(`/admin/students/${id}`),

  approveTeacher: (id: string) => api.patch(`/admin/teachers/${id}/approve`),

  rejectTeacher: (id: string, reason?: string) =>
    api.patch(`/admin/teachers/${id}/reject`, { reason }),
};

// E-commerce API
export const ecommerceApi = {
  // Categories
  getCategories: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/categories", { params }),

  createCategory: (data: {
    name: string;
    description?: string;
    image?: string;
  }) => api.post("/categories", data),

  updateCategory: (
    id: string,
    data: { name: string; description?: string; image?: string }
  ) => api.patch(`/categories/${id}`, data),

  deleteCategory: (id: string) => api.delete(`/categories/${id}`),

  // Products
  getProducts: (params?: {
    category?: string;
    school?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/products", { params }),

  getProductById: (id: string) => api.get(`/products/${id}`),

  createProduct: (data: any) => api.post("/products", data),

  updateProduct: (id: string, data: any) => api.patch(`/products/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/products/${id}`),

  // Product Variants
  addVariant: (productId: string, data: any) =>
    api.post(`/products/${productId}/variants`, data),

  updateVariant: (productId: string, variantId: string, data: any) =>
    api.patch(`/products/${productId}/variants/${variantId}`, data),

  deleteVariant: (productId: string, variantId: string) =>
    api.delete(`/products/${productId}/variants/${variantId}`),

  // Orders
  getOrders: (params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get("/admin/orders", { params }),

  getOrderById: (id: string) => api.get(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/admin/orders/${id}/status`, { status }),

  // Schools
  getSchools: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get("/schools", { params }),

  createSchool: (data: any) => api.post("/schools", data),

  updateSchool: (id: string, data: any) => api.patch(`/schools/${id}`, data),

  deleteSchool: (id: string) => api.delete(`/schools/${id}`),
};

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  }) => api.get("/notifications", { params }),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),

  createNotification: (data: {
    userId: string;
    role: string;
    type: string;
    title: string;
    body: string;
    meta?: any;
  }) => api.post("/notifications", data),
};

// File upload API
export const uploadApi = {
  getPresignedUrl: (data: {
    fileName: string;
    contentType: string;
    fileSize?: number;
  }) => api.post("/admin/presign", data),
};

// Analytics API
export const analyticsApi = {
  getUserStats: () => api.get("/analytics/admin/users"),

  getContentStats: () => api.get("/analytics/admin/content"),

  getEngagementStats: () => api.get("/analytics/admin/engagement"),

  getSalesStats: () => api.get("/analytics/admin/sales"),
};
