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
const PRIORITY = ["HIGH", "MEDIUM", "NORMAL", "LOW"];

const AddTask = ({ open, setOpen, task }) => {
  const [archivos, setArchivos] = useState([]);
  const [idTarea, setIdTarea] = useState(task?._id || null);
  const [uploadedFileNames, setUploadedFileNames] = useState(task?.assets || []);

  const defaultValues = {
    title: task?.title || "",
    date: dateFormatter(task?.date || new Date()),
    team: task?.team || [],
    stage: task?.stage?.toUpperCase() || LISTS[0],
    priority: task?.priority?.toUpperCase() || PRIORITY[2],
    assets: task?.assets || [],
    description: task?.description || "",
    links: task?.links || "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  const [stage, setStage] = useState(defaultValues.stage);
  const [team, setTeam] = useState(defaultValues.team);
  const [priority, setPriority] = useState(defaultValues.priority);
  const [uploading, setUploading] = useState(false);

  const [createTask, { isLoading }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();

  const handleFileChange = (e) => {
    setArchivos(Array.from(e.target.files));
  };

  const uploadFilesToServer = async (files, taskId) => {
    const uploadedNames = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("taskId", taskId);

      try {
        const res = await fetch("http://localhost/upload.php", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (res.ok && data.fileName) {
          uploadedNames.push(data.fileName);
        } else {
          throw new Error(data.error || "Error al subir archivo");
        }
      } catch (err) {
        throw err;
      }
    }
    return uploadedNames;
  };

  const handleOnSubmit = async (data) => {
    try {
      setUploading(true);

      // Crear tarea sin archivos
      const tareaCreada = await createTask({
        ...data,
        team,
        stage,
        priority,
        assets: [],
      }).unwrap();

      const idTareaCreada = tareaCreada.task?._id || tareaCreada._id;
      if (!idTareaCreada) {
        throw new Error("No se recibió el ID de la tarea");
      }

      setIdTarea(idTareaCreada);

      let uploadedNames = [];

      if (archivos.length > 0) {
        uploadedNames = await uploadFilesToServer(archivos, idTareaCreada);
      }

      if (uploadedNames.length > 0) {
        await updateTask({
          _id: idTareaCreada,
          assets: uploadedNames,
          team,
          stage,
          priority,
          ...data,
        }).unwrap();

        setUploadedFileNames(uploadedNames);
      }

      toast.success(tareaCreada.message || "Tarea creada con archivos");
      setTimeout(() => setOpen(false), 500);
    } catch (error) {
      console.error("Error al crear la tarea o subir archivos:", error);
      toast.error(error.message || "Error inesperado");
    } finally {
      setUploading(false);
    }
  };

  return (
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
              lists={PRIORITY}
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
            <div className="w-full flex flex-col items-center justify-center mt-4">
              <label
                htmlFor="fileUpload"
                className="flex items-center gap-1 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer my-4"
              >
                <BiImages />
                <span>Agregar Archivos</span>
              </label>
              <input
                id="fileUpload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              {archivos.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {archivos.length} archivo{archivos.length > 1 ? "s" : ""}{" "}
                  seleccionado{archivos.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

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
              Enlaces <span className="text-gray-600">separados por coma (,)</span>
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

        {idTarea && (
          <p className="text-xs text-gray-500 mt-2">ID de Tarea: {idTarea}</p>
        )}

        {uploadedFileNames.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold">Archivos asociados a esta tarea:</p>
            <ul className="list-disc list-inside text-sm">
              {uploadedFileNames.map((fileName, i) => (
                <li key={i}>{fileName}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </ModalWrapper>
  );
};

export default AddTask;
