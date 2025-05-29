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

    const taskTitle = req.body.taskTitle || 'temp_files';
    const sanitizedTitle = sanitizeFolderName(taskTitle);
    
    // Aquí puedes mover el archivo si quieres, pero multer ya lo guarda en la carpeta correcta
    // Solo se envía la respuesta con info del archivo
    
    const filePath = `/uploads/${sanitizedTitle}/${req.file.filename}`;

    res.status(200).json({
      message: 'Archivo subido exitosamente',
      filePath,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      taskFolder: sanitizedTitle
    });

  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getTaskFiles = async (req, res) => {
  try {
    const taskTitle = req.params.taskTitle;
    const sanitizedTitle = sanitizeFolderName(taskTitle);
    const uploadPath = path.join(process.cwd(), 'uploads', sanitizedTitle);

    if (!fs.existsSync(uploadPath)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(uploadPath).map(file => ({
      name: file,
      path: `/uploads/${sanitizedTitle}/${file}`,
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
    const { taskTitle, fileName } = req.params;
    const sanitizedTitle = sanitizeFolderName(taskTitle);
    const filePath = path.join(process.cwd(), 'uploads', sanitizedTitle, fileName);

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