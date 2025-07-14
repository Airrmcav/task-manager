import fs from 'fs';
import path from 'path';
import { sanitizeFolderName } from '../middleware/uploadMiddleware.js';

export const uploadFile = async (req, res) => {
  try {
    console.log('Request body in controller:', req.body);
    console.log('Request file in controller:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const taskId = req.body.taskId || 'temp_files';
    
    
    const filePath = `/uploads/${taskId}/${req.file.filename}`;

    // Obtener la fecha original del archivo (establecida en el middleware)
    const fileDate = req.fileOriginalDate || new Date();

    res.status(200).json({
      message: 'Archivo subido exitosamente',
      filePath,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileDate: fileDate.toISOString(), // Incluir la fecha original del archivo
      taskId
    });

  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTaskFiles = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const uploadPath = path.join(process.cwd(), 'uploads', taskId);

    if (!fs.existsSync(uploadPath)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadPath).map(file => ({
      name: file,
      path: `/uploads/${taskId}/${file}`,
      fullPath: path.join(uploadPath, file)
    }));

    res.status(200).json({ files });
  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { taskId, fileName } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', taskId, fileName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ message: 'Archivo eliminado exitosamente' });
    } else {
      res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
