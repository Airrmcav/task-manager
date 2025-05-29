import { Dialog } from "@headlessui/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BiImages } from "react-icons/bi";
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

async function uploadFile(file, taskTitle) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("taskTitle", taskTitle);

  console.log("Enviando archivo:", file.name);
  console.log("Enviando taskTitle:", taskTitle);

  try {
    const response = await fetch("http://localhost:8800/api/upload", {
      method: "POST",
      body: formData,
    });

    console.log("Status respuesta:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error uploading file: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log("Upload result:", result);
    return result.filePath; 
  } catch (error) {
    console.error("Error en uploadFile:", error);
    throw error;
  }
}


const AddTask = ({ open, setOpen, task }) => {
  const defaultValues = {
    title: task?.title || "",
    date: dateFormatter(task?.date || new Date()),
    team: [],
    stage: "",
    priority: "",
    assets: [],
    description: "",
    links: "",
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
  const [uploading, setUploading] = useState(false);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  // Obtener el título actual del formulario
  const currentTitle = watch("title");

  // Mantener las URLs existentes si es una actualización
  const existingAssets = task?.assets ? [...task.assets] : [];

  const handleOnSubmit = async (data) => {
    const uploadedFileURLs = [];

    // Verificar que hay un título antes de subir archivos
    if (!data.title.trim()) {
      toast.error("El título de la tarea es requerido antes de subir archivos");
      return;
    }

    // Subir nuevos archivos si los hay
    if (assets.length > 0) {
      setUploading(true);

      for (const file of assets) {
        try {
          const filePath = await uploadFile(file, data.title);
          uploadedFileURLs.push(filePath);
        } catch (error) {
          console.error("Error al subir los archivos:", error.message);
          toast.error(`Error al subir el archivo: ${file.name}`);
          setUploading(false);
          return;
        }
      }

      setUploading(false);
    }

    try {
      const newData = {
        ...data,
        assets: [...existingAssets, ...uploadedFileURLs],
        team,
        stage,
        priority,
      };

      console.log("Datos a enviar:", newData);

      const res = task?._id
        ? await updateTask({ ...newData, _id: task._id }).unwrap()
        : await createTask(newData).unwrap();

      toast.success(res.message);

      // Limpiar el estado de archivos
      setAssets([]);

      setTimeout(() => {
        setOpen(false);
      }, 500);
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || err.error);
    }
  };

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);
    setAssets(files);
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

            {/* Mostrar archivos seleccionados */}
            {assets.length > 0 && (
              <div className="w-full">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Archivos seleccionados:
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
