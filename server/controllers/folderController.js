import asyncHandler from "express-async-handler";
import Folder from "../models/folderModel.js";
import Task from "../models/taskModel.js";
import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';
import { sanitizeFolderName } from "../middleware/uploadMiddleware.js";

// Función auxiliar para verificar si todas las tareas de una carpeta están completadas
const checkFolderTasksStatus = async (folderId) => {
  try {
    console.log('Verificando estado de las tareas en la carpeta:', folderId);
    
    // Obtener la carpeta con sus tareas
    const folder = await Folder.findById(folderId);
    
    if (!folder || !folder.tasks || folder.tasks.length === 0) {
      console.log('La carpeta no existe o no tiene tareas');
      return false;
    }
    
    // Obtener todas las tareas de la carpeta
    const tasks = await Task.find({ _id: { $in: folder.tasks } });
    
    if (tasks.length === 0) {
      console.log('No se encontraron tareas para esta carpeta');
      return false;
    }
    
    // Verificar si todas las tareas están completadas
    const allTasksCompleted = tasks.every(task => task.stage === 'completed');
    console.log('¿Todas las tareas están completadas?', allTasksCompleted);
    
    // Actualizar el estado de la carpeta si es necesario
    if (allTasksCompleted && folder.status !== 'completed') {
      console.log('Actualizando estado de la carpeta a "completed"');
      folder.status = 'completed';
      await folder.save();
      return true;
    } else if (!allTasksCompleted && folder.status === 'completed') {
      console.log('Actualizando estado de la carpeta a "in progress"');
      folder.status = 'in progress';
      await folder.save();
      return false;
    }
    
    return allTasksCompleted;
  } catch (error) {
    console.error('Error al verificar el estado de las tareas de la carpeta:', error);
    return false;
  }
};

// @desc    Create a new folder
// @route   POST /api/folder/create
// @access  Private/Admin
const createFolder = asyncHandler(async (req, res) => {
  try {
    const { name, date, company, area, team } = req.body;
    
    // Asegurarnos de que la fecha se maneje correctamente
    let folderDate;
    if (date) {
      // Crear una fecha con la hora fija a mediodía para evitar problemas de zona horaria
      const dateObj = new Date(date);
      // Asegurarnos de que la hora está fija a mediodía
      dateObj.setHours(12, 0, 0, 0);
      folderDate = dateObj;
    } else {
      // Si no hay fecha, usar la fecha actual con hora fija a mediodía
      folderDate = new Date();
      folderDate.setHours(12, 0, 0, 0);
    }

    // Crear un objeto con todos los campos explícitamente
    const folderData = {
      name,
      date: folderDate,
      company,
      area,
      team: team || [],
    };
    
    const folder = await Folder.create(folderData);

    res
      .status(200)
      .json({ status: true, folder, message: "Carpeta creada exitosamente." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Get all folders
// @route   GET /api/folders
// @access  Private
const getFolders = asyncHandler(async (req, res) => {
  try {
    const { isTrashed = "false" } = req.query;

    // Si isTrashed es "all", no aplicamos filtro para obtener todas las carpetas
    const query = isTrashed === "all" ? {} : { isTrashed: isTrashed === "true" };

    const folders = await Folder.find(query)
      .populate({
        path: "team",
        select: "name title email"
      })
      .populate({
        path: "tasks",
        match: { isTrashed: false }, // Solo incluir tareas que no estén en la papelera
        select: "_id" // Solo necesitamos el ID para contar
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ status: true, folders });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Get a folder by ID
// @route   GET /api/folders/:id
// @access  Private
const getFolder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id)
      .populate({
        path: "team",
        select: "name title email"
      })
      .populate({
        path: "tasks",
        match: { isTrashed: false }, // Solo incluir tareas que no estén en la papelera
        populate: {
          path: "team",
          select: "name title email"
        }
      });

    if (!folder) {
      return res
        .status(404)
        .json({ status: false, message: "Carpeta no encontrada" });
    }

    res.status(200).json({ status: true, folder });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Update a folder
// @route   PUT /api/folders/update/:id
// @access  Private/Admin
const updateFolder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, company, area, team, pdfPath } = req.body;

    const folder = await Folder.findById(id);

    if (!folder) {
      return res
        .status(404)
        .json({ status: false, message: "Carpeta no encontrada" });
    }

    // Asegurarnos de que la fecha se maneje correctamente
    let folderDate;
    if (date) {
      // Crear una fecha con la hora fija a mediodía para evitar problemas de zona horaria
      const dateObj = new Date(date);
      // Asegurarnos de que la hora está fija a mediodía
      dateObj.setHours(12, 0, 0, 0);
      folderDate = dateObj;
    } else {
      folderDate = folder.date;
    }

    folder.name = name || folder.name;
    folder.date = folderDate;
    folder.company = company || folder.company;
    folder.area = area || folder.area;
    folder.team = team || folder.team;
    // Actualizar pdfPath solo si se proporciona
    if (pdfPath !== undefined) {
      folder.pdfPath = pdfPath;
    }

    const updatedFolder = await folder.save();

    res.status(200).json({
      status: true,
      folder: updatedFolder,
      message: "Carpeta actualizada exitosamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Move a folder to trash
// @route   PUT /api/folders/:id
// @access  Private/Admin
const trashFolder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id);

    if (!folder) {
      return res
        .status(404)
        .json({ status: false, message: "Carpeta no encontrada" });
    }

    folder.isTrashed = !folder.isTrashed;

    await folder.save();

    res.status(200).json({
      status: true,
      message: folder.isTrashed
        ? "Carpeta movida a la papelera"
        : "Carpeta restaurada de la papelera",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Delete a folder permanently
// @route   DELETE /api/folders/delete-restore/:id
// @access  Private/Admin
const deleteRestoreFolder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findById(id);

    if (!folder) {
      return res
        .status(404)
        .json({ status: false, message: "Carpeta no encontrada" });
    }

    // Eliminar la carpeta permanentemente de la base de datos
    await Folder.findByIdAndDelete(id);

    return res
      .status(200)
      .json({ status: true, message: "Carpeta eliminada permanentemente de la base de datos" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Add a task to a folder
// @route   PUT /api/folders/add-task/:id
// @access  Private/Admin
const addTaskToFolder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { taskId } = req.body;

    const folder = await Folder.findById(id);

    if (!folder) {
      return res
        .status(404)
        .json({ status: false, message: "Carpeta no encontrada" });
    }

    // Verificar si la tarea ya está en la carpeta
    if (folder.tasks.includes(taskId)) {
      return res
        .status(400)
        .json({ status: false, message: "La tarea ya está en esta carpeta" });
    }

    folder.tasks.push(taskId);
    await folder.save();
    
    // Verificar si todas las tareas de la carpeta están completadas después de agregar la nueva tarea
    await checkFolderTasksStatus(id);

    res.status(200).json({
      status: true,
      message: "Tarea agregada a la carpeta exitosamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Remove a task from a folder
// @route   PUT /api/folders/remove-task/:id
// @access  Private/Admin
const removeTaskFromFolder = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { taskId } = req.body;

    const folder = await Folder.findById(id);

    if (!folder) {
      return res
        .status(404)
        .json({ status: false, message: "Carpeta no encontrada" });
    }

    // Verificar si la tarea está en la carpeta
    if (!folder.tasks.includes(taskId)) {
      return res
        .status(400)
        .json({ status: false, message: "La tarea no está en esta carpeta" });
    }

    folder.tasks = folder.tasks.filter(
      (task) => task.toString() !== taskId.toString()
    );
    await folder.save();
    
    // Verificar si todas las tareas de la carpeta están completadas después de eliminar la tarea
    await checkFolderTasksStatus(id);

    res.status(200).json({
      status: true,
      message: "Tarea eliminada de la carpeta exitosamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// @desc    Upload PDF to folder
// @route   POST /api/folder/upload-pdf/:id
// @access  Private/Admin
const uploadFolderPdf = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: false, message: 'No se proporcionó ningún archivo PDF' });
    }

    const folderId = req.params.id;
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ status: false, message: 'Carpeta no encontrada' });
    }

    // Crear directorio para la carpeta si no existe
    const folderName = sanitizeFolderName(folder.name);
    const uploadPath = path.join(process.cwd(), 'uploads', folderName);
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Construir la ruta del archivo
    const pdfPath = `/uploads/${folderName}/${req.file.filename}`;
    
    // Actualizar la carpeta con la ruta del PDF
    folder.pdfPath = pdfPath;
    await folder.save();

    res.status(200).json({
      status: true,
      message: 'PDF subido exitosamente',
      pdfPath,
      folder
    });
  } catch (error) {
    console.error('Error al subir PDF:', error);
    res.status(500).json({ status: false, message: error.message });
  }
});

export {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  trashFolder,
  deleteRestoreFolder,
  addTaskToFolder,
  removeTaskFromFolder,
  uploadFolderPdf
};
