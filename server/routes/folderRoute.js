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
  uploadFolderPdf
} from "../controllers/folderController.js";
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/create", protectRoute, isAdminRoute, createFolder);

router.get("/", protectRoute, getFolders);
router.get("/:id", protectRoute, getFolder);

router.put("/update/:id", protectRoute, isAdminRoute, updateFolder);
router.put("/add-task/:id", protectRoute, isAdminRoute, addTaskToFolder);
router.put("/remove-task/:id", protectRoute, isAdminRoute, removeTaskFromFolder);
router.put("/:id", protectRoute, isAdminRoute, trashFolder);

// Ruta para subir PDF a una carpeta
router.post("/upload-pdf/:id", protectRoute, isAdminRoute, upload.single('pdf'), uploadFolderPdf);

router.delete(
  "/delete-restore/:id",
  protectRoute,
  isAdminRoute,
  deleteRestoreFolder
);

export default router;
