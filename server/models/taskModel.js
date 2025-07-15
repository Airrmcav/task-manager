import mongoose, { Schema } from "mongoose";
import { VALID_ACTIVITY_TYPES, VALID_FILE_STATUSES } from "../utils/constants.js";

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
    // Almacena el estado de los archivos de la tarea principal
    fileStatuses: {
      type: Object,
      default: () => ({})
    },
    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: VALID_ACTIVITY_TYPES,
        },
        activity: String,
        file: String,
        status: {
          type: String,
          enum: VALID_FILE_STATUSES,
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
        assets: [String], // Archivos adjuntos a la subtarea
        fileStatuses: {
          type: Object,
          default: () => ({})
        }
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
