export const formatDate = (date) => {
  // Get the month, day, and year
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();

  // Format the date as "MM dd, yyyy"
  const formattedDate = `${day}-${month}-${year}`;

  return formattedDate;
};


export function dateFormatter(dateString) {
  // Si no hay fecha, devolver cadena vacía
  if (!dateString) return "";
  
  // Si es un string con formato YYYY-MM-DD (formato del input date)
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Para inputs de tipo date, simplemente devolver el string tal cual
    // ya que está en el formato correcto YYYY-MM-DD
    return dateString;
  }
  
  // Si es un objeto Date
  if (dateString instanceof Date) {
    // Asegurarnos de usar getUTCFullYear, getUTCMonth, etc. para evitar problemas de zona horaria
    const year = dateString.getUTCFullYear();
    const month = dateString.getUTCMonth() + 1; // getUTCMonth devuelve 0-11
    const day = dateString.getUTCDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  
  // Si es un string con formato ISO (con T)
  if (typeof dateString === 'string' && dateString.includes('T')) {
    // Extraer solo la parte de la fecha (YYYY-MM-DD)
    return dateString.split('T')[0];
  }
  
  // Cualquier otro caso, intentar crear una fecha UTC
  try {
    const tempDate = new Date(dateString);
    if (!isNaN(tempDate)) {
      const year = tempDate.getUTCFullYear();
      const month = tempDate.getUTCMonth() + 1;
      const day = tempDate.getUTCDate();
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  } catch (error) {
    console.error("Error al formatear la fecha:", error);
  }
  
  return "";
}

export function getInitials(fullName) {
  const names = fullName.split(" ");

  const initials = names.slice(0, 2).map((name) => name[0].toUpperCase());

  const initialsStr = initials.join("");

  return initialsStr;
}

export const updateURL = ({ searchTerm, navigate, location }) => {
  const params = new URLSearchParams();

  if (searchTerm) {
    params.set("search", searchTerm);
  }

  const newURL = `${location?.pathname}?${params.toString()}`;
  navigate(newURL, { replace: true });

  return newURL;
};

export const PRIOTITYSTYELS = {
  high: "text-red-600",
  medium: "text-yellow-600",
  low: "text-blue-600",
};

export const TASK_TYPE = {
  todo: "bg-blue-600",
  "in progress": "bg-yellow-600",
  completed: "bg-green-600",
};

export const BGS = [
  "bg-blue-600",
  "bg-yellow-600",
  "bg-red-600",
  "bg-green-600",
];

export const getCompletedSubTasks = (items) => {
  const totalCompleted = items?.filter((item) => item?.isCompleted).length;

  return totalCompleted;
};

export function countTasksByStage(tasks) {
  let inProgressCount = 0;
  let todoCount = 0;
  let completedCount = 0;

  tasks?.forEach((task) => {
    switch (task.stage.toLowerCase()) {
      case "in progress":
        inProgressCount++;
        break;
      case "todo":
        todoCount++;
        break;
      case "completed":
        completedCount++;
        break;
      default:
        break;
    }
  });

  return {
    inProgress: inProgressCount,
    todo: todoCount,
    completed: completedCount,
  };
}
