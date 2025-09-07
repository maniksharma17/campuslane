import mongoose from "mongoose";

export interface User {
  _id: mongoose.Schema.Types.ObjectId | string;
  studentCode?: string;
  name: string;
  email: string;
  age?: number;
  role: 'student' | 'parent' | 'teacher';
  pinCode: string;
  city: string;
  state: string;
  country: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}