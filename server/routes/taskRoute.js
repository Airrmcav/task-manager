import express from "express";
import {
  createSubTask,
  createTask,
  dashboardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateSubTaskStage,
  updateTask,
  updateTaskStage,
  updateFileStatus,
  updateSubTaskFileStatus,
  addFileToSubTask,
  removeSubTaskFile,
  deleteSubTask,
} from "../controllers/taskController.js";
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", protectRoute, isAdminRoute, createTask);
router.post("/duplicate/:id", protectRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectRoute, postTaskActivity);

router.get("/dashboard", protectRoute, dashboardStatistics);
router.get("/", protectRoute, getTasks);
router.get("/:id", protectRoute, getTask);

// Ruta para eliminar una subtarea completa
// Esta ruta recibe: taskId y subTaskId en el body
// IMPORTANTE: Esta ruta debe estar antes de cualquier otra ruta PUT para evitar conflictos con la ruta comodín /:id
router.put("/delete-subtask", protectRoute, deleteSubTask);

router.put("/create-subtask/:id", protectRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectRoute, updateTask);
router.put("/change-stage/:id", protectRoute, updateTaskStage);
router.put(
  "/change-status/:taskId/:subTaskId",
  protectRoute,
  updateSubTaskStage
);
router.put("/update-file-status", protectRoute, updateFileStatus);
router.put("/update-subtask-file-status", protectRoute, updateSubTaskFileStatus);
router.put("/add-file-to-subtask/:id", protectRoute, addFileToSubTask);
// Ruta para eliminar un archivo de una subtarea
// Esta ruta recibe: taskId, subTaskId y fileUrl en el body
router.put("/remove-subtask-file", protectRoute, removeSubTaskFile);

// IMPORTANTE: Esta ruta debe estar al final porque usa un parámetro comodín que podría capturar otras rutas
// Si se añaden nuevas rutas PUT, deben ir ANTES de esta ruta
// La ruta comodín /:id puede capturar solicitudes a /delete-subtask si se define después
router.put("/:id", protectRoute, isAdminRoute, trashTask);

router.delete(
  "/delete-restore/:id?",
  protectRoute,
  isAdminRoute,
  deleteRestoreTask
);

export default router;
