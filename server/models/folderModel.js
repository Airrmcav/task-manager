import mongoose, { Schema } from "mongoose";

const folderSchema = new Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, default: Date.now },
    company: { type: String, default: "M&CAV" },
    area: { type: String, default: "Sistemas" },
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    isTrashed: { type: Boolean, default: false },
    pdfPath: { type: String, default: null },
    status: {
      type: String,
      default: "in progress",
      enum: ["todo", "in progress", "completed"],
    }, 
  },
  { timestamps: true }
);

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;
