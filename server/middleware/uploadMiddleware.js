import multer from 'multer';
import fs from 'fs';
import path from 'path';

function sanitizeFolderName(name) {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

// Configuración de almacenamiento local con multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Request body at destination:', req.body);
    const taskId = req.body.taskId;
    console.log('Task ID from request:', taskId);

    if (!taskId) {
      console.error('Error: No taskId provided in request');
      const uploadPath = path.join(process.cwd(), 'uploads', 'temp_files');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Created temp directory:', uploadPath);
      }
      return cb(null, uploadPath);
    }

    const uploadPath = path.join(process.cwd(), 'uploads', taskId);
  
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Created directory:', uploadPath);
    }
  
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    console.log('File being processed:', file.originalname);
    // Usar la fecha proporcionada en la solicitud o la fecha actual si no se proporciona
    const fileDate = req.body.fileDate ? new Date(req.body.fileDate) : new Date();
    const timestamp = fileDate.getTime();
    const uniqueSuffix = timestamp + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    const finalName = baseName + '-' + uniqueSuffix + extension;
    console.log('Generated filename with date:', finalName);
    // Guardar la fecha original del archivo en la solicitud para su uso posterior
    req.fileOriginalDate = fileDate;
    cb(null, finalName);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('Checking file type:', file.mimetype);
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error('File type not allowed:', file.mimetype);
    cb(new Error('Tipo de archivo no permitido'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const handleMulterError = (err, req, res, next) => {
  console.error('Multer error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'El archivo es demasiado grande. Máximo 10MB permitido.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Demasiados archivos o campo de archivo inesperado.'
      });
    }
  }

  if (err.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({
      error: 'Tipo de archivo no permitido. Solo se permiten imágenes, PDFs y documentos.'
    });
  }

  if (err.message === 'El título de la tarea es requerido') {
    return res.status(400).json({
      error: 'El título de la tarea es requerido'
    });
  }

  next(err);
};

export {
  upload,
  handleMulterError,
  sanitizeFolderName
};
