import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
  {
    title: { type: String, required: true },
    area: { type: String, default: "Sistemas" },
    company: { type: String, default: "M&CAV" },
    date: { type: Date, default: Date.now },
    priority: {
      type: String,
      default: "normal",
      enum: ["high", "medium", "normal", "low"],
    },
    stage: {
      type: String,
      default: "todo",
      enum: ["todo", "in progress", "completed"],
    },
    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: [
            "assigned",
            "started",
            "in progress",
            "bug",
            "completed",
            "commented",
            "file_status_changed",
          ],
        },
        activity: String,
        file: String,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending"
        },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        date: { type: Date, default: Date.now },
      },
    ],
    subTasks: [
      {
        title: String,
        date: Date,
        tag: String,
        isCompleted: Boolean,
      },
    ],
    description: String,
    assets: [String],
    links: [String],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isTrashed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
