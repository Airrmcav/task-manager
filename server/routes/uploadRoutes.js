import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { upload, handleMulterError } from '../middleware/uploadMiddleware.js';
import { uploadFile, getTaskFiles, deleteFile } from '../controllers/uploadController.js';

const router = express.Router();

// Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Rutas
router.post('/', upload.single('file'), uploadFile);
router.get('/task-files/:taskTitle', getTaskFiles);
router.delete('/file/:taskTitle/:fileName', deleteFile);

// Servir archivos estáticos desde la carpeta uploads
router.use('/files', express.static(path.join(__dirname, '..', 'uploads')));

// Middleware de errores de multer
router.use(handleMulterError);

export default router;