// Constantes para tipos de actividades válidos en el modelo de tareas
export const ACTIVITY_TYPES = {
  ASSIGNED: "assigned",
  STARTED: "started",
  IN_PROGRESS: "in progress",
  BUG: "bug",
  COMPLETED: "completed",
  COMMENTED: "commented",
  FILE_STATUS_CHANGED: "file_status_changed",
  FILE_REMOVED: "file_removed"
};

// Array con todos los tipos de actividades válidos
export const VALID_ACTIVITY_TYPES = [
  ACTIVITY_TYPES.ASSIGNED,
  ACTIVITY_TYPES.STARTED,
  ACTIVITY_TYPES.IN_PROGRESS,
  ACTIVITY_TYPES.BUG,
  ACTIVITY_TYPES.COMPLETED,
  ACTIVITY_TYPES.COMMENTED,
  ACTIVITY_TYPES.FILE_STATUS_CHANGED,
  ACTIVITY_TYPES.FILE_REMOVED
];

// Constantes para estados de archivos válidos
export const FILE_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};

// Array con todos los estados de archivos válidos
export const VALID_FILE_STATUSES = [
  FILE_STATUSES.PENDING,
  FILE_STATUSES.APPROVED,
  FILE_STATUSES.REJECTED
];

// Constantes para etapas de tareas
export const TASK_STAGES = {
  TODO: "todo",
  IN_PROGRESS: "in progress",
  COMPLETED: "completed"
};

// Array con todas las etapas de tareas válidas
export const VALID_TASK_STAGES = [
  TASK_STAGES.TODO,
  TASK_STAGES.IN_PROGRESS,
  TASK_STAGES.COMPLETED
];