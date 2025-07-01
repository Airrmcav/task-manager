import asyncHandler from "express-async-handler";
import Notice from "../models/notis.js";
import Task from "../models/taskModel.js";
import User from "../models/userModel.js";
import Folder from "../models/folderModel.js";

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
  const { title, tag, date } = req.body;
  const { id } = req.params;

  try {
    const newSubTask = {
      title,
      date,
      tag,
      isCompleted: false,
    };

    const task = await Task.findById(id);

    task.subTasks.push(newSubTask);

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
    const { taskId, fileUrl, status } = req.body;
    const { userId } = req.user;

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

    // Buscar si ya existe una actividad para este archivo
    const existingActivityIndex = task.activities.findIndex(
      (act) => act.file === fileUrl && act.type === 'file_status_changed'
    );

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

    if (existingActivityIndex !== -1) {
      // Actualizar la actividad existente
      task.activities[existingActivityIndex].status = status;
      task.activities[existingActivityIndex].activity = activityText;
      task.activities[existingActivityIndex].by = userId;
    } else {
      // Crear una nueva actividad
      task.activities.push({
        type: "file_status_changed",
        activity: activityText,
        file: fileUrl,
        status: status,
        by: userId,
      });
    }

    await task.save();

    res.status(200).json({ 
      status: true, 
      message: `Estado del archivo actualizado a ${statusText}.` 
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message });
  }
});

export {
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
};
