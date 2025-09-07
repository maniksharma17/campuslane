import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, ApprovalStatus } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  role: UserRole;
  googleId?: string;
  age?: number; 
  classLevel?: mongoose.Types.ObjectId;
  classOther?: string;
  studentCode?: string; 
  approvalStatus?: ApprovalStatus; 
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
    role: { 
      type: String, 
      enum: ['student', 'teacher', 'parent'], 
      required: true 
    },
    googleId: { type: String, unique: true, sparse: true },

    // Student-specific fields
    age: { 
      type: Number, 
      required: function(this: IUser) { return this.role === 'student'; }
    },
    classLevel: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Class",
    },
    classOther: { 
      type: String, 
    },
    studentCode: { 
      type: String, 
      unique: true, 
      immutable: true,   
      sparse: true,
    },

    // Teacher-specific fields
    approvalStatus: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: function(this: IUser) { return this.role === 'teacher' ? 'pending' : undefined; }
    },

    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(_doc, ret) {
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
        delete ret.deletedBy;
        return ret;
      },
    },
  }
);

// --- 🔑 Generate 6-char uppercase alphanumeric studentCode automatically ---
function generateStudentCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

userSchema.pre<IUser>('validate', async function (next) {
  if (this.role === 'student' && !this.studentCode) {
    let code: string;
    let exists = true;

    // Ensure uniqueness
    do {
      code = generateStudentCode();
      const existing = await mongoose.models.User.findOne({ studentCode: code });
      if (!existing) exists = false;
    } while (exists);

    this.studentCode = code;
  }
  next();
});

// Indexes
userSchema.index({ role: 1, approvalStatus: 1 });
userSchema.index({ isDeleted: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
