import mongoose, { type Model } from "mongoose";

export type CourseOrderDoc = {
  orderId: string;
  courseId: string;
  courseTitle: string;
  amount: string;
  buyerName: string;
  buyerEmail: string;
  videoUrl?: string;
  status: "paid";
  source?: "real" | "demo";
  createdAt: Date;
};

const CourseOrderSchema = new mongoose.Schema<CourseOrderDoc>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    amount: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    videoUrl: { type: String },
    status: { type: String, enum: ["paid"], default: "paid", required: true },
    source: { type: String, enum: ["real", "demo"] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CourseOrderModel: Model<CourseOrderDoc> =
  (mongoose.models.CourseOrder as Model<CourseOrderDoc>) || mongoose.model<CourseOrderDoc>("CourseOrder", CourseOrderSchema);
