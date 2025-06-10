import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { BiImages } from "react-icons/bi";
import { IoMdClose } from "react-icons/io";
import { toast } from "sonner";

import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../../redux/slices/api/taskApiSlice";
import { dateFormatter } from "../../utils";
import Button from "../Button";
import Loading from "../Loading";
import ModalWrapper from "../ModalWrapper";
import SelectList from "../SelectList";
import Textbox from "../Textbox";
import UserList from "./UsersSelect";

const LISTS = ["TODO", "IN PROGRESS", "COMPLETED"];
const PRIORIRY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

async function uploadFile(file, taskTitle, taskId) {
  if (!file) return null;

  const formData = new FormData();
  formData.append("archivo", file);
  formData.append("taskId", taskId);
  formData.append("taskTitle", taskTitle);

  console.log("Enviando archivo:", file.name);
  console.log("Enviando taskId:", taskId);

  try {
    const response = await fetch("https://mcav.com.mx/uploads/upload.php", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Error en la subida: ${response.status}`);
    }

    const data = await response.json();
    console.log("Respuesta del servidor:", data);
    
    if (data.success && data.filePath) {
      return data.filePath;
    } else {
      throw new Error(data.message || "Error al subir el archivo");
    }
  } catch (error) {
    console.error("Error en uploadFile:", error);
    throw new Error(`Error al subir ${file.name}: ${error.message}`);
  }
}

const AddTask = ({ open, setOpen, task }) => {
  const defaultValues = {
    title: task?.title || "",
  
    // Por esto (crear la fecha con hora fija a mediodía)
    date: dateFormatter(task?.date || new Date(new Date().setHours(12, 0, 0, 0))),
    team: [],
    stage: "",
    priority: "",
    assets: [],
    description: task?.description || "",
    links: task?.links ? task.links.join(",") : "",  // Convertir array a string con comas
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({ defaultValues });

  const [stage, setStage] = useState(task?.stage?.toUpperCase() || LISTS[0]);
  const [team, setTeam] = useState(task?.team || []);
  const [priority, setPriority] = useState(
    task?.priority?.toUpperCase() || PRIORIRY[2]
  );
  const [assets, setAssets] = useState([]);
  // Usar useEffect para actualizar existingAssets cuando cambia task
  const [existingAssets, setExistingAssets] = useState([]);

  // Actualizar existingAssets cuando cambia task
  useEffect(() => {
    if (task?.assets && Array.isArray(task.assets)) {
      setExistingAssets([...task.assets]);
      console.log('Task assets actualizados:', task.assets);
    }
  }, [task]);
  const [uploading, setUploading] = useState(false);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // Obtener el título actual del formulario
  const currentTitle = watch("title");

  const handleOnSubmit = async (data) => {
    try {
      // Asegurarnos de que la fecha se maneja correctamente
      const taskDate = data.date;
      
      // 1. Si es una tarea nueva, primero la creamos sin archivos
      if (!task?._id) {
        // Crear la tarea primero sin archivos
        const newTask = {
          ...data,
          date: taskDate, // Usar la fecha tal cual viene del formulario
          team,
          stage,
          priority,
          assets: [], // Inicialmente sin archivos
        };

        const res = await createTask(newTask).unwrap();
        const newTaskId = res.task._id;
        toast.success(res.message);

        // 2. Si hay archivos para subir, los subimos después de crear la tarea
        if (assets.length > 0) {
          setUploading(true);
          const newUploadedFiles = [];

          for (const file of assets) {
            try {
              const filePath = await uploadFile(file, data.title, newTaskId);
              newUploadedFiles.push(filePath);
            } catch (error) {
              console.error("Error al subir el archivo:", error);
              toast.error(`Error al subir el archivo: ${file.name}`);
            }
          }

          // Actualizar la tarea con las rutas de los archivos
          if (newUploadedFiles.length > 0) {
            try {
              await updateTask({
                _id: newTaskId,
                title: data.title,
                date: data.date,
                team: team,
                stage: stage.toLowerCase(),
                priority: priority.toLowerCase(),
                assets: newUploadedFiles,
                links: data.links,
                description: data.description,
              }).unwrap();
            } catch (updateErr) {
              console.error(
                "Error al actualizar la tarea con archivos:",
                updateErr
              );
              toast.error("Error al guardar las rutas de los archivos");
            }
          }

          setUploading(false);
        }

        // Cerrar el modal después de un breve retraso
        setTimeout(() => {
          setAssets([]);
          setOpen(false);
        }, 500);
      } else {
        // Si es una actualización de tarea existente
        if (assets.length > 0) {
          setUploading(true);
          const uploadedFileURLs = [];

          // Subir los nuevos archivos
          for (const file of assets) {
            try {
              const filePath = await uploadFile(file, data.title, task._id);
              uploadedFileURLs.push(filePath);
            } catch (error) {
              console.error("Error al subir el archivo:", error);
              toast.error(`Error al subir el archivo: ${file.name}`);
            }
          }

          // Asegurarse de que links sea una cadena de texto
          const linksString = typeof data.links === 'string' ? data.links : '';

          // Actualizar la tarea con las nuevas rutas de archivos
          await updateTask({
            _id: task._id,
            title: data.title,
            date: data.date,
            team: team,
            stage: stage.toLowerCase(),
            priority: priority.toLowerCase(),
            assets: [...existingAssets, ...uploadedFileURLs],
            links: linksString,
            description: data.description,
          }).unwrap();

          setUploading(false);
          toast.success("Tarea actualizada correctamente");
        } else {
          // Si no hay archivos nuevos, actualizar solo los datos de la tarea

          // Asegurarse de que links sea una cadena de texto
          const linksString = typeof data.links === 'string' ? data.links : '';

          await updateTask({
            _id: task._id,
            title: data.title,
            date: data.date,
            team: team,
            stage: stage.toLowerCase(),
            priority: priority.toLowerCase(),
            assets: existingAssets,
            links: linksString,
            description: data.description,
          }).unwrap();
          toast.success("Tarea actualizada correctamente");
        }

        // Cerrar el modal después de un breve retraso
        setTimeout(() => {
          setAssets([]);
          setOpen(false);
        }, 500);
      }
    } catch (err) {
      console.error("Error al guardar la tarea:", err);
      toast.error(err?.data?.message || "Error al guardar la tarea");
      setUploading(false);
    }
  };

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    setAssets(files);
  };

  // Función para eliminar un archivo nuevo seleccionado
  const removeNewFile = (index) => {
    const updatedAssets = [...assets];
    updatedAssets.splice(index, 1);
    setAssets(updatedAssets);
  };

  // Función para eliminar un archivo existente
  const removeExistingFile = (index) => {
    const updatedExistingAssets = [...existingAssets];
    updatedExistingAssets.splice(index, 1);
    setExistingAssets(updatedExistingAssets);
    console.log("Archivo existente eliminado:", index);
    console.log("Archivos existentes actualizados:", updatedExistingAssets);
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)}>
          <Dialog.Title
            as="h2"
            className="text-base font-bold leading-6 text-gray-900 mb-4"
          >
            {task ? "Actualizar Tarea" : "Agregar Tarea"}
          </Dialog.Title>

          <div className="mt-2 flex flex-col gap-6">
            <Textbox
              placeholder="Titulo de la Tarea"
              type="text"
              name="title"
              label="Titulo de la Tarea"
              className="w-full rounded"
              register={register("title", {
                required: "Titulo de la Tarea es requerido!",
              })}
              error={errors.title ? errors.title.message : ""}
            />

            <UserList setTeam={setTeam} team={team} />

            <div className="flex gap-4">
              <SelectList
                label="Etapa de la Tarea"
                lists={LISTS}
                selected={stage}
                setSelected={setStage}
              />
              <SelectList
                label="Nivel de Prioridad"
                lists={PRIORIRY}
                selected={priority}
                setSelected={setPriority}
              />
            </div>

            <div className="flex gap-4">
              <div className="w-full">
                <Textbox
                  placeholder="Fecha"
                  type="date"
                  name="date"
                  label="Fecha de la Tarea"
                  className="w-full rounded"
                  register={register("date", {
                    required: "Fecha de la Tarea es requerida!",
                  })}
                  error={errors.date ? errors.date.message : ""}
                />
              </div>

              <div className="w-full flex items-center justify-center mt-4">
                <label
                  className="flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
                  htmlFor="imgUpload"
                >
                  <input
                    type="file"
                    className="hidden"
                    id="imgUpload"
                    onChange={(e) => handleSelect(e)}
                    accept=".jpg, .png, .jpeg, .pdf, .doc, .docx"
                    multiple={true}
                  />
                  <BiImages />
                  <span>Agregar Archivos</span>
                </label>
              </div>
            </div>

            {assets.length > 0 && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Archivos nuevos seleccionados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(assets).map((file, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {file.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mostrar archivos existentes de la tarea */}
            {existingAssets && existingAssets.length > 0 && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Archivos existentes:
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingAssets.map((filePath, index) => {
                    // Extraer el nombre del archivo de la ruta
                    const fileName = filePath.split("/").pop();
                    return (
                      <div
                        key={`existing-${index}`}
                        className="px-2 py-1 w-full bg-white  text-xs rounded-full flex items-center justify-between"
                      >
                        <div>
                          <span className="mr-2">{fileName}</span>
                        </div>
                        <div>

                          <button
                            type="button"
                            onClick={() => removeExistingFile(index)}
                            className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700 focus:outline-none"
                            title="Eliminar archivo"
                          >
                            <IoMdClose size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="w-full">
              <p>Descripción de la Tarea</p>
              <textarea
                name="description"
                {...register("description")}
                className="w-full bg-transparent px-3 py-1.5 2xl:py-3 border border-gray-300
            dark:border-gray-600 placeholder-gray-300 dark:placeholder-gray-700
            text-gray-900 dark:text-white outline-none text-base focus:ring-2
            ring-blue-300"
              ></textarea>
            </div>

            <div className="w-full">
              <p>
                Enlaces{" "}
                <span className="text-gray-600">separados por coma (,)</span>
              </p>
              <textarea
                name="links"
                {...register("links")}
                className="w-full bg-transparent px-3 py-1.5 2xl:py-3 border border-gray-300
            dark:border-gray-600 placeholder-gray-300 dark:placeholder-gray-700
            text-gray-900 dark:text-white outline-none text-base focus:ring-2
            ring-blue-300"
              ></textarea>
            </div>
          </div>

          {isLoading || isUpdating || uploading ? (
            <div className="py-4">
              <Loading />
            </div>
          ) : (
            <div className="bg-gray-50 mt-6 mb-4 sm:flex sm:flex-row-reverse gap-4">
              <Button
                label="Enviar"
                type="submit"
                className="bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
              />

              <Button
                type="button"
                className="bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto"
                onClick={() => setOpen(false)}
                label="Cancelar"
              />
            </div>
          )}
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddTask;
