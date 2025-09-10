import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  studentId: mongoose.Types.ObjectId;
  contentId: mongoose.Types.ObjectId;
  status: "not_started" | "in_progress" | "completed";
  timeSpent: number;
  lastWatchedSecond: number;
  progressPercent: number;
  watchSessions?: { startedAt: Date; duration: number }[];
  quizScore?: number;
  completedAt?: Date;
  contentSnapshot?: {
    title?: string;
    type?: string;
    duration?: number;
    s3key?: string
  };
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
      required: true,
    },
    timeSpent: { type: Number, default: 0, min: 0 },
    lastWatchedSecond: { type: Number, default: 0, min: 0 },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
    watchSessions: [
      {
        startedAt: { type: Date, default: Date.now },
        duration: { type: Number, default: 0 },
      },
    ],
    quizScore: { type: Number, min: 0, max: 100 },
    completedAt: Date,
    contentSnapshot: {
      title: String,
      type: String,
      duration: Number,
    },
  },
  { timestamps: true }
);

progressSchema.index({ studentId: 1, contentId: 1 }, { unique: true });

progressSchema.pre("save", function (next) {
  if (this.progressPercent === 100 && this.status !== "completed") {
    this.status = "completed";
    this.completedAt = new Date();
  } else if (this.progressPercent > 0 && this.status === "not_started") {
    this.status = "in_progress";
  }
  next();
});

export const Progress = mongoose.model<IProgress>(
  "Progress",
  progressSchema
);
