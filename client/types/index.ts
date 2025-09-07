import mongoose from "mongoose";

export interface User {
  _id: mongoose.Schema.Types.ObjectId | string;
  studentCode?: string;
  name: string;
  email: string;
  age?: number;
  classLevel?: mongoose.Types.ObjectId;
  classOther?: string;
  role: 'student' | 'parent' | 'teacher';
  pinCode: string;
  city: string;
  state: string;
  country: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}