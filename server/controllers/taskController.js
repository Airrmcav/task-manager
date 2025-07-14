import asyncHandler from "express-async-handler";
import Notice from "../models/notis.js";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import Folder from "../models/folderModel.js";
import fs from 'fs';
import path from 'path';

// Función auxiliar para verificar el estado de los archivos en una colección
const checkFilesStatus = (assets, fileStatuses) => {
  console.log('Verificando si todos los archivos están aprobados...');
  
  // Verificar si hay algún archivo pendiente o rechazado
  let hasPendingOrRejected = false;
  let allApproved = true;
  
  // Recorrer todos los archivos para verificar su estado
  for (const asset of assets) {
    // Convertir cada asset a su clave segura correspondiente
    const assetSafeKey = asset.replace(/\./g, '_dot_').replace(/\//g, '_slash_');
    const fileStatus = fileStatuses[assetSafeKey];
    console.log(`Archivo: ${asset}, Clave segura: ${assetSafeKey}, Estado: ${fileStatus}`);
    
    // Si el archivo está pendiente o rechazado, marcar la bandera
    if (fileStatus === "pending" || fileStatus === "rejected") {
      hasPendingOrRejected = true;
      allApproved = false;
      break; // No es necesario seguir verificando
    }
    
    // Si el archivo no tiene estado, considerarlo como pendiente
    if (!fileStatus) {
      hasPendingOrRejected = true;
      allApproved = false;
      break; // No es necesario seguir verificando
    }
  }
  
  console.log('¿Hay archivos pendientes o rechazados?', hasPendingOrRejected);
  console.log('¿Todos los archivos están aprobados?', allApproved);
  
  return { hasPendingOrRejected, allApproved };
};

const createTask = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets, links, description, area, company } =
      req.body;
    
    // console.log('Datos recibidos en el servidor:', { title, team, stage, date, priority, assets, links, description, area, company });
    
    // Asegurarnos de que la fecha se maneje correctamente
    let taskDate;
    if (date) {
      // Crear una fecha con la hora fija a mediodía para evitar problemas de zona horaria
      const dateObj = new Date(date);
      // Asegurarnos de que la hora está fija a mediodía
      dateObj.setHours(12, 0, 0, 0);
      taskDate = dateObj;
      // console.log('Fecha procesada en el servidor:', taskDate.toISOString(), 'Fecha local:', taskDate.toLocaleDateString());
    } else {
      // Si no hay fecha, usar la fecha actual con hora fija a mediodía
      taskDate = new Date();
      taskDate.setHours(12, 0, 0, 0);
    }

    let text = "Se te ha asignado una nueva tarea";
    if (team?.length > 1) {
      text += ` y a ${team.length - 1} personas más.`;
    }
    text += ` La prioridad de la tarea está establecida como ${priority} y debe ser atendida en consecuencia. La fecha de la tarea es ${taskDate.toLocaleDateString("es-ES")}. ¡Gracias!`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };
    let newLinks = null;

    if (links) {
      newLinks = links?.split(",");
    }

    // Crear un objeto con todos los campos explícitamente
    const taskData = {
      title,
      team,
      stage: stage.toLowerCase(),
      date: taskDate, // Usar la fecha procesada
      priority: priority.toLowerCase(),
      assets,
      activities: activity,
      links: newLinks || [],
      description,
      area,
      company, // Asegurarse de que este campo se incluye
    };
    
    console.log('Objeto de tarea a crear:', taskData);
    
    const task = await Task.create(taskData);

    await Notice.create({
      team,
      text,
      task: task._id,
    });

    const users = await User.find({
      _id: team,
    });

    if (users) {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        await User.findByIdAndUpdate(user._id, { $push: { tasks: task._id } });
      }
    }

    res
      .status(200)
      .json({ status: true, task, message: "Tarea creada exitosamente." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

const duplicateTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const task = await Task.findById(id);

    let text = "Se te ha asignado una nueva tarea";
    if (task.team?.length > 1) {
      text += ` y a ${task.team.length - 1} personas más.`;
    }

    text +=
      ` La prioridad de la tarea está establecida como ${
        task.priority
      } y debe ser atendida en consecuencia. La fecha de la tarea es ${new Date(
        task.date
      ).toDateString()}. Thank you!!!`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };

    const newTask = await Task.create({
      ...task,
      title: "Duplicate - " + task.title,
    });

    newTask.team = task.team;
    newTask.subTasks = task.subTasks;
    newTask.assets = task.assets;
    newTask.links = task.links;
    newTask.priority = task.priority;
    newTask.stage = task.stage;
    newTask.activities = activity;
    newTask.description = task.description;

    await newTask.save();

    await Notice.create({
      team: newTask.team,
      text,
      task: newTask._id,
    });

    res
      .status(200)
      .json({ status: true, message: "Tarea duplicada exitosamente." });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, team, stage, priority, assets, links, description, area, company } =
    req.body;
    
  console.log('Datos de actualización recibidos:', { title, date, team, stage, priority, assets, links, description, area, company });

  // Asegurarnos de que la fecha se maneje correctamente
  let taskDate;
  if (date) {
    // Crear una fecha con la hora fija a mediodía para evitar problemas de zona horaria
    const dateObj = new Date(date);
    // Asegurarnos de que la hora está fija a mediodía
    dateObj.setHours(12, 0, 0, 0);
    taskDate = dateObj;
    console.log('Fecha procesada en actualización:', taskDate.toISOString(), 'Fecha local:', taskDate.toLocaleDateString());
  } else {
    // Si no hay fecha, usar la fecha actual con hora fija a mediodía
    taskDate = new Date();
    taskDate.setHours(12, 0, 0, 0);
  }

  try {
    const task = await Task.findById(id);

    let newLinks = [];

    if (links) {
      newLinks = links.split(",");
    }

    // Actualizar todos los campos explícitamente
    task.title = title;
    task.date = taskDate; // Usar la fecha procesada
    task.priority = priority.toLowerCase();
    task.assets = assets;
    task.stage = stage.toLowerCase();
    task.team = team;
    task.links = newLinks;
    task.description = description;
    task.area = area;
    task.company = company; // Asegurarse de que este campo se actualiza
    
    console.log('Objeto de tarea a actualizar:', {
      title: task.title,
      date: task.date,
      priority: task.priority,
      assets: task.assets,
      stage: task.stage,
      team: task.team,
      links: task.links,
      description: task.description,
      area: task.area,
      company: task.company
    });

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Tarea actualizada exitosamente." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

const updateTaskStage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const task = await Task.findById(id);

    task.stage = stage.toLowerCase();

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Estado de la tarea actualizado exitosamente." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

const updateSubTaskStage = asyncHandler(async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { status } = req.body;
    
    console.log('updateSubTaskStage - Parámetros recibidos:', { taskId, subTaskId, status });
    
    if (!taskId || taskId === 'undefined') {
      return res.status(400).json({ status: false, message: 'ID de tarea inválido o no proporcionado' });
    }
    
    if (!subTaskId || subTaskId === 'undefined') {
      return res.status(400).json({ status: false, message: 'ID de subtarea inválido o no proporcionado' });
    }

    await Task.findOneAndUpdate(
      {
        _id: taskId,
        "subTasks._id": subTaskId,
      },
      {
        $set: {
          "subTasks.$.isCompleted": status,
        },
      }
    );

    res.status(200).json({
      status: true,
      message: status
        ? "Tarea marcada como completada"
        : "Tarea marcada como incompleta",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

const createSubTask = asyncHandler(async (req, res) => {
  const { title, tag, date, file } = req.body;
  const { id } = req.params;

  try {
    const newSubTask = {
      title,
      date,
      tag,
      isCompleted: false,
      assets: file ? [file] : [],
    };

    const task = await Task.findById(id);

    task.subTasks.push(newSubTask);

    // Si hay un archivo, también lo agregamos a los assets de la tarea principal
    if (file && !task.assets.includes(file)) {
      task.assets.push(file);
    }

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "SubTarea agregada exitosamente." });
  } catch (error) {
    return res.status(400).json({ status: false, message: error.message });
  }
});

const getTasks = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { stage, isTrashed, search } = req.query;

  let query = { isTrashed: isTrashed ? true : false };

  if (!isAdmin) {
    query.team = { $all: [userId] };
  }
  if (stage) {
    query.stage = stage;
  }

  if (search) {
    const searchQuery = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { stage: { $regex: search, $options: "i" } },
        { priority: { $regex: search, $options: "i" } },
      ],
    };
    query = { ...query, ...searchQuery };
  }

  let queryResult = Task.find(query)
    .populate({
      path: "team",
      select: "name title email",
    })
    .sort({ _id: -1 });

  const tasks = await queryResult;

  res.status(200).json({
    status: true,
    tasks,
  });
});

const getTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    throw new Error("Failed to fetch task", error);
  }
});

const postTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { type, activity, file } = req.body;

  try {
    const task = await Task.findById(id);

    const data = {
      type,
      activity,
      by: userId,
      file: file || undefined, // Only include file if it exists
    };
    
    task.activities.push(data);
    
    // If there's a file, add it to the assets array if not already present
    if (file) {
      if (!task.assets.includes(file)) {
        task.assets.push(file);
      }
    }

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Actividad publicada exitosamente." });
  } catch (error) {
    console.error('Error in postTaskActivity:', error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

const addFileToSubTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subTaskId, file } = req.body;

  try {
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Tarea no encontrada.",
      });
    }

    // Encontrar la subtarea por su ID
    const subTask = task.subTasks.id(subTaskId);
    
    if (!subTask) {
      return res.status(404).json({
        status: false,
        message: "Sub-tarea no encontrada.",
      });
    }

    // Inicializar el array de assets si no existe
    if (!subTask.assets) {
      subTask.assets = [];
    }

    // Agregar el archivo a la subtarea
    subTask.assets.push(file);

    // También agregar el archivo a los assets de la tarea principal si no existe
    if (!task.assets.includes(file)) {
      task.assets.push(file);
    }

    await task.save();

    res.status(200).json({
      status: true,
      message: "Archivo agregado a la sub-tarea exitosamente.",
    });
  } catch (error) {
    console.error('Error en addFileToSubTask:', error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

const trashTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isTrashed } = req.body;

  try {
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Tarea no encontrada.",
      });
    }

    // Verificar si isTrashed es "trash" (desde el cliente) o true/false
    if (isTrashed === "trash") {
      task.isTrashed = true;
    } else {
      task.isTrashed = Boolean(isTrashed);
    }

    await task.save();

    // Si la tarea se está moviendo a la papelera, también la eliminamos de todas las carpetas
    if (task.isTrashed) {
      // Eliminar la tarea de todas las carpetas que la contienen
      await Folder.updateMany(
        { tasks: id },
        { $pull: { tasks: id } }
      );
    }

    res.status(200).json({
      status: true,
      message: task.isTrashed 
        ? `Tarea movida a la papelera exitosamente.`
        : `Tarea restaurada exitosamente.`,
    });
  } catch (error) {
    console.error("Error en trashTask:", error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

const deleteRestoreTask = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      // Primero, eliminar la tarea de todas las carpetas que la contienen
      await Folder.updateMany(
        { tasks: id },
        { $pull: { tasks: id } }
      );
      
      // Luego eliminar la tarea
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      // Obtener todas las tareas que están en la papelera
      const trashedTasks = await Task.find({ isTrashed: true });
      const trashedTaskIds = trashedTasks.map(task => task._id);
      
      // Eliminar todas las tareas de la papelera de todas las carpetas
      if (trashedTaskIds.length > 0) {
        await Folder.updateMany(
          { tasks: { $in: trashedTaskIds } },
          { $pull: { tasks: { $in: trashedTaskIds } } }
        );
      }
      
      // Eliminar todas las tareas de la papelera
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);

      resp.isTrashed = false;

      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    res.status(200).json({
      status: true,
      message: `Operación realizada exitosamente.`,
    });
  } catch (error) {
    console.error("Error en deleteRestoreTask:", error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

const dashboardStatistics = asyncHandler(async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    // Fetch all tasks from the database
    const allTasks = isAdmin
      ? await Task.find({
          isTrashed: false,
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 })
      : await Task.find({
          isTrashed: false,
          team: { $all: [userId] },
        })
          .populate({
            path: "team",
            select: "name role title email",
          })
          .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isActive createdAt")
      .limit(10)
      .sort({ _id: -1 });

    // Group tasks by stage and calculate counts
    const groupedTasks = allTasks?.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    const graphData = Object.entries(
      allTasks?.reduce((result, task) => {
        const { priority } = task;
        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // Calculate total tasks
    const totalTasks = allTasks.length;
    const last10Task = allTasks?.slice(0, 10);

    // Combine results into a summary object
    const summary = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupedTasks,
      graphData,
    };

    res
      .status(200)
      .json({ status: true, ...summary, message: "Estadísticas obtenidas exitosamente." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
});

// Actualizar el estado de un archivo en una tarea
const updateFileStatus = asyncHandler(async (req, res) => {
  try {
    console.log('Datos recibidos en updateFileStatus:', req.body);
    console.log('Usuario en la solicitud:', req.user);
    
    const { taskId, fileUrl, status } = req.body;
    const { userId } = req.user;

    // Validación rápida de parámetros
    if (!taskId || !fileUrl || !status) {
      return res.status(400).json({ 
        status: false, 
        message: "Se requiere el ID de la tarea, la URL del archivo y el estado." 
      });
    }

    // Verificar que el estado sea válido
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        status: false, 
        message: "Estado no válido. Debe ser 'pending', 'approved' o 'rejected'." 
      });
    }

    // Imprimir la URL del archivo para depuración
    console.log('URL del archivo recibida en updateFileStatus:', fileUrl);

    // Buscar la tarea por ID sin poblar inicialmente para mayor velocidad
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ 
        status: false, 
        message: "Tarea no encontrada." 
      });
    }

    // Verificar si el archivo existe en la tarea
    if (!task.assets.includes(fileUrl)) {
      return res.status(404).json({ 
        status: false, 
        message: "Archivo no encontrado en la tarea." 
      });
    }
    
    // Inicializar fileStatuses como un objeto plano si no existe
    if (!task.fileStatuses) {
      task.fileStatuses = {};
    }
    
    // Usar una clave segura para MongoDB reemplazando puntos y otros caracteres problemáticos
    // Esto evita el error "Mongoose maps do not support keys that contain '.'"
    console.log('Creando clave segura para:', fileUrl);
    const safeKey = fileUrl.replace(/\./g, '_dot_').replace(/\//g, '_slash_');
    console.log('Clave segura creada:', safeKey);
    
    // Tratar fileStatuses como un objeto plano en lugar de un Map
    console.log('Estado actual de fileStatuses:', task.fileStatuses);
    task.fileStatuses[safeKey] = status;
    console.log('Nuevo estado de fileStatuses:', task.fileStatuses);

    let statusText = "";
    switch (status) {
      case "pending":
        statusText = "en proceso";
        break;
      case "approved":
        statusText = "aprobado";
        break;
      case "rejected":
        statusText = "rechazado";
        break;
    }

    const activityText = `El archivo ${fileUrl.split('/').pop()} ha sido marcado como ${statusText}`;
    
    // Crear una nueva actividad
    const newActivity = {
      type: "file_status_changed",
      activity: activityText,
      file: fileUrl,
      status: status,
      by: userId,
      date: new Date()
    };
    
    // Añadir la nueva actividad al principio del array
    task.activities.unshift(newActivity);

    // Actualizar el estado de la tarea según el estado del archivo
    if (status === "approved" && task.stage !== "completed") {
      task.stage = "completed";
    } else if ((status === "rejected" || status === "pending") && task.stage === "completed") {
      task.stage = "in progress";
    }
    
    // Verificar si todos los archivos están aprobados
    if (status === "approved") {
      const { allApproved } = checkFilesStatus(task.assets, task.fileStatuses);
      
      if (allApproved) {
        task.stage = "completed";
        console.log('Tarea marcada como completada');
      }
    }

    // Marcar el documento como modificado para asegurar que Mongoose guarde los cambios
    task.markModified('fileStatuses');
    
    // Guardar la tarea con la nueva actividad y el estado actualizado
    await task.save();

    // Respuesta rápida sin poblar toda la tarea para mejorar el rendimiento
    res.status(200).json({ 
      status: true, 
      message: `Estado del archivo actualizado a ${statusText}.`,
      fileStatus: status,
      taskStage: task.stage
    });
    
    // Opcionalmente, poblar la tarea en segundo plano si es necesario para otras operaciones
    // pero no esperar a que termine para responder al cliente
    Task.findById(task._id)
      .populate({
        path: "activities.by",
        select: "name"
      })
      .then(() => {
        // No es necesario hacer nada con el resultado
      })
      .catch(err => {
        console.error("Error al poblar la tarea en segundo plano:", err);
      });
      
  } catch (error) {
    console.error("Error al actualizar el estado del archivo:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// Actualizar el estado de un archivo en una subtarea
const updateSubTaskFileStatus = asyncHandler(async (req, res) => {
  try {
    console.log('Datos recibidos en updateSubTaskFileStatus:', req.body);
    console.log('Usuario en la solicitud:', req.user);
    
    const { taskId, subTaskId, fileUrl, status } = req.body;
    const { userId } = req.user;

    // Validación rápida de parámetros
    if (!taskId || !subTaskId || !fileUrl || !status) {
      return res.status(400).json({ 
        status: false, 
        message: "Se requiere el ID de la tarea, ID de la subtarea, la URL del archivo y el estado." 
      });
    }

    // Verificar que el estado sea válido
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        status: false, 
        message: "Estado no válido. Debe ser 'pending', 'approved' o 'rejected'." 
      });
    }

    // Imprimir la URL del archivo para depuración
    console.log('URL del archivo recibida:', fileUrl);

    // Buscar la tarea por ID
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ 
        status: false, 
        message: "Tarea no encontrada." 
      });
    }

    // Encontrar la subtarea
    const subTask = task.subTasks.id(subTaskId);
    
    if (!subTask) {
      return res.status(404).json({ 
        status: false, 
        message: "Sub-tarea no encontrada." 
      });
    }

    // Verificar si el archivo existe en la subtarea
    if (!subTask.assets || !subTask.assets.includes(fileUrl)) {
      return res.status(404).json({ 
        status: false, 
        message: "Archivo no encontrado en la sub-tarea." 
      });
    }

    // Inicializar fileStatuses como un objeto plano si no existe
    if (!subTask.fileStatuses) {
      subTask.fileStatuses = {};
    }
    
    // Usar una clave segura para MongoDB reemplazando puntos y otros caracteres problemáticos
    // Esto evita el error "Mongoose maps do not support keys that contain '.'"
    console.log('Creando clave segura para:', fileUrl);
    const safeKey = fileUrl.replace(/\./g, '_dot_').replace(/\//g, '_slash_');
    console.log('Clave segura creada:', safeKey);
    
    // Tratar fileStatuses como un objeto plano en lugar de un Map
    // Esto es más compatible con MongoDB y evita problemas de serialización
    if (!subTask.fileStatuses) {
      subTask.fileStatuses = {};
    }
    
    console.log('Estado actual de fileStatuses:', subTask.fileStatuses);
    subTask.fileStatuses[safeKey] = status;
    console.log('Nuevo estado de fileStatuses:', subTask.fileStatuses);

    let statusText = "";
    switch (status) {
      case "pending":
        statusText = "en proceso";
        break;
      case "approved":
        statusText = "aprobado";
        break;
      case "rejected":
        statusText = "rechazado";
        break;
    }

    const activityText = `El archivo ${fileUrl.split('/').pop()} de la sub-tarea "${subTask.title}" ha sido marcado como ${statusText}`;
    
    // Crear una nueva actividad
    const newActivity = {
      type: "file_status_changed",
      activity: activityText,
      file: fileUrl,
      status: status,
      by: userId,
      date: new Date()
    };
    
    // Añadir la nueva actividad al principio del array
    task.activities.unshift(newActivity);

    // Actualizar el estado de la subtarea según el estado de sus archivos
    if (subTask.assets && subTask.assets.length > 0) {
      const { hasPendingOrRejected, allApproved } = checkFilesStatus(subTask.assets, subTask.fileStatuses);
      
      // Si hay archivos pendientes o rechazados, marcar la subtarea como no completada
      if (hasPendingOrRejected) {
        subTask.isCompleted = false;
        console.log('Subtarea marcada como no completada porque hay archivos pendientes o rechazados');
      } else {
        // Si todos los archivos están aprobados, marcar la subtarea como completada
        subTask.isCompleted = true;
        console.log('Subtarea marcada como completada automáticamente porque todos los archivos restantes están aprobados');
      }
    } else if (subTask.assets.length === 0) {
      // Si no quedan archivos, mantener el estado actual de la subtarea
      console.log('No quedan archivos en la subtarea, manteniendo el estado actual:', subTask.isCompleted);
    }
    
    // Marcar el documento como modificado para asegurar que Mongoose guarde los cambios
    task.markModified('subTasks');
    
    // Guardar la tarea con la nueva actividad y el estado actualizado
    await task.save();

    // Respuesta rápida sin poblar toda la tarea para mejorar el rendimiento
    res.status(200).json({ 
      status: true, 
      message: `Estado del archivo actualizado a ${statusText}.`,
      fileStatus: status,
      subTaskCompleted: subTask.isCompleted
    });
    
  } catch (error) {
    console.error("Error al actualizar el estado del archivo de la subtarea:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// Eliminar un archivo de una subtarea
const removeSubTaskFile = asyncHandler(async (req, res) => {
  const { taskId, subTaskId, fileUrl } = req.body;
  const { userId } = req.user;

  try {
    // Validación rápida de parámetros
    if (!taskId || !subTaskId || !fileUrl) {
      return res.status(400).json({ 
        status: false, 
        message: "Se requiere el ID de la tarea, ID de la subtarea y la URL del archivo." 
      });
    }

    // Buscar la tarea por ID
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ 
        status: false, 
        message: "Tarea no encontrada." 
      });
    }

    // Encontrar la subtarea
    const subTask = task.subTasks.id(subTaskId);
    
    if (!subTask) {
      return res.status(404).json({ 
        status: false, 
        message: "Sub-tarea no encontrada." 
      });
    }

    // Verificar si el archivo existe en la subtarea
    if (!subTask.assets || !subTask.assets.includes(fileUrl)) {
      return res.status(404).json({ 
        status: false, 
        message: "Archivo no encontrado en la sub-tarea." 
      });
    }

    // Eliminar el archivo de la subtarea
    subTask.assets = subTask.assets.filter(asset => asset !== fileUrl);
    
    // Si el archivo tenía un estado, eliminarlo también
    if (subTask.fileStatuses) {
      const safeKey = fileUrl.replace(/\./g, '_dot_').replace(/\//g, '_slash_');
      delete subTask.fileStatuses[safeKey];
    }

    // Crear una nueva actividad
    const activityText = `El archivo ${fileUrl.split('/').pop()} ha sido eliminado de la sub-tarea "${subTask.title}"`;
    
    const newActivity = {
      type: "file_removed",
      activity: activityText,
      file: fileUrl,
      by: userId,
      date: new Date()
    };
    
    // Añadir la nueva actividad al principio del array
    task.activities.unshift(newActivity);

    // Marcar el documento como modificado para asegurar que Mongoose guarde los cambios
    task.markModified('subTasks');
    
    // Guardar la tarea con la nueva actividad y el estado actualizado
    await task.save();

    // Respuesta rápida sin poblar toda la tarea para mejorar el rendimiento
    res.status(200).json({ 
      status: true, 
      message: "Archivo eliminado de la sub-tarea exitosamente."
    });
    
  } catch (error) {
    console.error("Error al eliminar el archivo de la subtarea:", error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

// Exportar todas las funciones del controlador
export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStage,
  createSubTask,
  updateSubTaskStage,
  postTaskActivity,
  dashboardStatistics,
  trashTask,
  deleteRestoreTask,
  duplicateTask,
  updateFileStatus,
  updateSubTaskFileStatus,
  addFileToSubTask,
  removeSubTaskFile
};
      
