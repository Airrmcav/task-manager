import express from "express";
import {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  trashFolder,
  deleteRestoreFolder,
  addTaskToFolder,
  removeTaskFromFolder,
} from "../controllers/folderController.js";
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protectRoute, isAdminRoute, createFolder);

router.get("/", protectRoute, getFolders);
router.get("/:id", protectRoute, getFolder);

router.put("/update/:id", protectRoute, isAdminRoute, updateFolder);
router.put("/add-task/:id", protectRoute, isAdminRoute, addTaskToFolder);
router.put("/remove-task/:id", protectRoute, isAdminRoute, removeTaskFromFolder);
router.put("/:id", protectRoute, isAdminRoute, trashFolder);

router.delete(
  "/delete-restore/:id",
  protectRoute,
  isAdminRoute,
  deleteRestoreFolder
);

export default router;