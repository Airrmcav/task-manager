import clsx from "clsx";
import moment from "moment";
import React, { useState } from "react";
import {
  FaBug,
  FaFile,
  FaImage,
  FaSpinner,
  FaTasks,
  FaThumbsUp,
  FaUser,
} from "react-icons/fa";
import { GrInProgress } from "react-icons/gr";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdKeyboardDoubleArrowUp,
  MdOutlineDoneAll,
  MdOutlineMessage,
  MdTaskAlt,
} from "react-icons/md";
import { RxActivityLog } from "react-icons/rx";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button, Loading, Tabs } from "../components";
import { TaskColor } from "../components/tasks";
import {
  useChangeSubTaskStatusMutation,
  useGetSingleTaskQuery,
  usePostTaskActivityMutation,
} from "../redux/slices/api/taskApiSlice";
import {
  PRIOTITYSTYELS,
  TASK_TYPE,
  getCompletedSubTasks,
  getInitials,
} from "../utils";

const assets = [
  "https://images.pexels.com/photos/2418664/pexels-photo-2418664.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/8797307/pexels-photo-8797307.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/2534523/pexels-photo-2534523.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  "https://images.pexels.com/photos/804049/pexels-photo-804049.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
];

const ICONS = {
  high: <MdKeyboardDoubleArrowUp />,
  medium: <MdKeyboardArrowUp />,
  low: <MdKeyboardArrowDown />,
};

const bgColor = {
  high: "bg-red-200",
  medium: "bg-yellow-200",
  low: "bg-blue-200",
};

const TABS = [
  { title: "Detalles de la Tarea", icon: <FaTasks />, key: 'details' },
  { title: "Actividades/Timeline", icon: <RxActivityLog />, key: 'activities' },
];

const TASKTYPEICON = {
  commented: (
    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
      <MdOutlineMessage />,
    </div>
  ),
  started: (
    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
      <FaThumbsUp size={20} />
    </div>
  ),
  assigned: (
    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-500 text-white">
      <FaUser size={14} />
    </div>
  ),
  bug: (
    <div className="text-red-600">
      <FaBug size={24} />
    </div>
  ),
  completed: (
    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white">
      <MdOutlineDoneAll size={24} />
    </div>
  ),
  "in progress": (
    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 text-white">
      <GrInProgress size={16} />
    </div>
  ),
};

const act_types = [
  "Started",
  "Completed",
  "In Progress",
  "Commented",
  "Bug",
  "Assigned",
];

const Activities = ({ activity, id, refetch, onActivityAdded }) => {
  const [selected, setSelected] = useState("Started");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [postActivity, { isLoading }] = usePostTaskActivityMutation();

  const uploadFile = async (file, taskId) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. First upload to Node.js API
      const response = await fetch("http://localhost:8800/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Error uploading file: ${response.status} - ${errorData.error || "Unknown error"}`
        );
      }

      const result = await response.json();
      console.log("Upload result:", result);

      // 2. Second upload to PHP
      const phpFormData = new FormData();
      phpFormData.append("archivo", file);
      phpFormData.append("taskId", taskId);

      try {
        const phpResponse = await fetch("https://mcav.com.mx/uploads/upload.php", {
          method: "POST",
          body: phpFormData,
        });
        
        const phpData = await phpResponse.json();
        console.log("Subida a PHP:", phpData);
        
        if (phpData.success && phpData.filePath) {
          return phpData.filePath;
        }
      } catch (phpError) {
        console.error("Error al subir a PHP:", phpError);
      }
      
      return taskId ? `/uploads/${taskId}` : result.filePath;
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (isLoading || isUploading) return;
    
    try {
      setIsUploading(true);
      let filePath = null;
      
      if (file) {
        filePath = await uploadFile(file, id);
      }

      const data = {
        type: selected?.toLowerCase(),
        activity: text,
        file: filePath,
      };
      
      const res = await postActivity({
        data,
        id,
      }).unwrap();
      
      setText("");
      setFile(null);
      setIsUploading(false);
      toast.success(res?.message);
      
      await refetch();
      if (onActivityAdded) {
        onActivityAdded();
      }
    } catch (err) {
      console.log(err);
      setIsUploading(false);
      toast.error(err?.data?.message || err.error || "Error al subir el archivo");
    }
  };

  const Card = ({ item }) => {
    return (
      <div className={`flex space-x-4`}>
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 flex items-center justify-center">
            {TASKTYPEICON[item?.type]}
          </div>
          <div className="h-full flex items-center">
            <div className="w-0.5 bg-gray-300 h-full"></div>
          </div>
        </div>

        <div className="flex flex-col gap-y-1 mb-8">
          <p className="font-semibold">{item?.by?.name}</p>
          <div className="text-gray-500 space-x-2">
            <span className="capitalize">{item?.type}</span>
            <span className="text-sm">{moment(item?.date).fromNow()}</span>
          </div>
          <div className="text-gray-700">{item?.activity}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex gap-10 2xl:gap-20 min-h-screen px-10 py-8 bg-white shadow rounded-md justify-between overflow-y-auto">
      <div className="w-full md:w-1/2">
        <h4 className="text-gray-600 font-semibold text-lg mb-5">
          Actividades
        </h4>
        <div className="w-full space-y-0">
          {activity?.map((item, index) => (
            <Card
              key={item.id}
              item={item}
              isConnected={index < activity?.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="w-full md:w-1/1">
        <h4 className="text-gray-600 font-semibold text-lg mb-5">
          Agregar Actividad
        </h4>
        <div className="w-full flex flex-wrap gap-5">
          {act_types.map((item, index) => (
            <div key={item} className="flex gap-2 items-center">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selected === item ? true : false}
                onChange={(e) => setSelected(item)}
              />
              <p>{item}</p>
            </div>
          ))}
          <div className="w-full flex">
            
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 cursor-pointer"
              disabled={isUploading}
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Archivo seleccionado: {file.name}
              </div>
            )}
          </div>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type ......"
            className="bg-white w-full mt-2 border border-gray-300 outline-none p-4 rounded-md focus:ring-2 ring-blue-500"
          ></textarea>
          {isLoading || isUploading ? (
            <Loading />
          ) : (
            <Button
              type="button"
              label={isUploading ? "Subiendo..." : "Enviar"}
              onClick={handleSubmit}
              className={`bg-blue-600 text-white rounded ${(isLoading || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading || isUploading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const TaskDetail = () => {
  const { id } = useParams();
  const { data, isLoading, refetch } = useGetSingleTaskQuery(id);
  const [subTaskAction, { isLoading: isSubmitting }] =
    useChangeSubTaskStatusMutation();

  const [activeTab, setActiveTab] = useState("details");
  const [refreshKey, setRefreshKey] = useState(0);
  const task = data?.task;

  // Function to refresh task data
  const refreshTaskData = async () => {
    try {
      await refetch();
      // Force remount of the Activities component
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error refreshing task data:", error);
    }
  };

  if (isLoading)
    <div className="py-10">
      <Loading />
    </div>;

  const percentageCompleted =
    task?.subTasks?.length === 0
      ? 0
      : (getCompletedSubTasks(task?.subTasks) / task?.subTasks?.length) * 100;

  return (
    <div className="w-full flex flex-col gap-3 mb-4 overflow-y-hidden">
      {/* task detail */}
      <h1 className="text-2xl text-gray-600 font-bold">{task?.title}</h1>
      <div className="flex items-center gap-5">
        <div
          className={clsx(
            "flex gap-1 items-center text-base font-semibold px-3 py-1 rounded-full",
            PRIOTITYSTYELS[task?.priority],
            bgColor[task?.priority]
          )}
        >
          <span className="text-lg">{ICONS[task?.priority]}</span>
          <span className="uppercase">{task?.priority} Priority</span>
        </div>

        <div className={clsx("flex items-center gap-2")}>
          <TaskColor className={TASK_TYPE[task?.stage]} />
          <span className="text-black uppercase">{task?.stage}</span>
        </div>
      </div>

      <p className="text-gray-500">
        Creado el: {new Date(task?.date).toDateString()}
      </p>
      <Tabs 
        tabs={TABS} 
        selectedIndex={TABS.findIndex(tab => tab.key === activeTab)} 
        setSelected={(index) => setActiveTab(TABS[index].key)}
      >
        <div className={activeTab === 'details' ? 'block' : 'hidden'}>
          <div className="w-full flex flex-col md:flex-row gap-5 2xl:gap-8 bg-white shadow rounded-md px-8 py-8 overflow-y-auto">
            <div className="w-full md:w-1/2 space-y-8">
              {task?.description && (
                <div className="mb-10">
                  <p className="text-lg font-semibold">
                    Descripción de la Tarea
                  </p>
                  <div className="w-full">{task?.description}</div>
                </div>
              )}

              {task?.links?.length > 0 && (
                <div className="">
                  <p className="text-lg font-semibold">Links de Apoyo</p>
                  <div className="w-full flex flex-col gap-4">
                    {task?.links?.map((el, index) => (
                      <a
                        key={index}
                        href={el}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        {el}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-8 p-4 border-y border-gray-200">
                <div className="space-x-2">
                  <span className="font-semibold">Archivos :</span>
                  <span>{task?.assets?.length}</span>
                </div>
                <span className="text-gray-400">|</span>
                <div className="space-x-2">
                  <span className="font-semibold">Sub-Tareas :</span>
                  <span>{task?.subTasks?.length}</span>
                </div>
              </div>

              <div className="space-y-4 py-6">
                <p className="text-gray-500 font-semibold text-sm">
                  Equipo de la Tarea
                </p>
                <div className="space-y-3">
                  {task?.team?.map((m, index) => (
                    <div
                      key={index + m?._id}
                      className="flex gap-4 py-2 items-center border-t border-gray-200"
                    >
                      <div
                        className={
                          "w-10 h-10 rounded-full text-white flex items-center justify-center text-sm -mr-1 bg-blue-600"
                        }
                      >
                        <span className="text-center">
                          {getInitials(m?.name)}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{m?.name}</p>
                        <span className="text-gray-500">{m?.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {task?.subTasks?.length > 0 && (
                <div className="space-y-4 py-6">
                  <div className="flex items-center gap-5">
                    <p className="text-gray-500 font-semibold text-sm">
                      Sub-Tareas
                    </p>
                    <div
                      className={`w-fit h-8 px-2 rounded-full flex items-center justify-center text-white ${
                        percentageCompleted < 50
                          ? "bg-rose-600"
                          : percentageCompleted < 80
                          ? "bg-amber-600"
                          : "bg-emerald-600"
                      }`}
                    >
                      <p>{percentageCompleted.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {task?.subTasks?.map((el, index) => (
                      <div key={index + el?._id} className="flex gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-violet-200">
                          <MdTaskAlt className="text-violet-600" size={26} />
                        </div>

                        <div className="space-y-1">
                          <div className="flex gap-2 items-center">
                            <span className="text-sm text-gray-500">
                              {new Date(el?.date).toDateString()}
                            </span>

                            <span
                              className={`px-2 py-0.5 text-center text-sm rounded-full font-semibold ${
                                el?.isCompleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {el?.isCompleted ? "done" : "in progress"}
                            </span>
                          </div>
                          <p className="text-gray-700 pb-2">{el?.title}</p>

                          <>
                            <button
                              disabled={isSubmitting}
                              className={`text-sm outline-none bg-gray-100 text-gray-800 p-1 rounded ${
                                el?.isCompleted
                                  ? "hover:bg-rose-100 hover:text-rose-800"
                                  : "hover:bg-emerald-100 hover:text-emerald-800"
                              } disabled:cursor-not-allowed`}
                              onClick={() =>
                                handleSubmitAction({
                                  status: el?.isCompleted,
                                  id: task?._id,
                                  subId: el?._id,
                                })
                              }
                            >
                              {isSubmitting ? (
                                <FaSpinner className="animate-spin" />
                              ) : el?.isCompleted ? (
                                " Marcar como No Realizado"
                              ) : (
                                " Marcar como Realizado"
                              )}
                            </button>
                          </>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-1/2 space-y-3">
              <div className="pb-10">
                <p className="text-lg font-semibold">Archivos / Documentos</p>
                {task?.assets && task.assets.length > 0 ? (
                  <div className="w-full flex flex-wrap gap-4 mt-5">
                    {task.assets.map((el, index) => {
                      const getFileType = (filePath) => {
                        if (!filePath) return "unknown";
                        const extension = filePath
                          .split(".")
                          .pop()
                          .toLowerCase();
                        const imageExtensions = [
                          "jpg",
                          "jpeg",
                          "png",
                          "gif",
                          "bmp",
                          "webp",
                        ];
                        return imageExtensions.includes(extension)
                          ? "image"
                          : "document";
                      };

                      const fileType = getFileType(el);
                      const fileUrl = el.startsWith("http")
                        ? el
                        : `https://mcav.com.mx${el}`;
                      const fileName = el.split("/").pop();

                      return (
                        <div
                          key={index}
                          className="relative overflow-hidden rounded group flex flex-col items-center justify-center "
                        >
                          {fileType === "image" ? (
                            <button
                              className="w-full items-center inline-flex bg-white text-black border px-4 py-2 rounded-md text-sm font-medium shadow-md"
                              onClick={() => window.open(fileUrl, "_blank")}
                            >
                              <div className="p-2 bg-gray-300 mx-1 rounded">
                                <FaImage className="mx-2 text-2xl text-blue-600" />
                              </div>
                              <span className="flex-1 text-left">
                                {fileName}
                              </span>
                            </button>
                          ) : (
                            <button
                              className="w-full items-center inline-flex bg-white text-black border px-4 py-2 rounded-md text-sm font-medium shadow-md"
                              onClick={() => window.open(fileUrl, "_blank")}
                            >
                              <div className="p-2 bg-gray-300 mx-1 rounded">
                                <FaFile className="mx-2 text-2xl text-blue-600" />
                              </div>
                              <span className="flex-1 text-left">
                                {fileName}
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 italic mt-2">
                    No hay archivos adjuntos para esta tarea
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className={activeTab === 'activities' ? 'block' : 'hidden'}>
          <Activities 
            key={refreshKey}
            activity={task?.activities} 
            refetch={refetch} 
            id={id} 
            onActivityAdded={refreshTaskData} 
          />
        </div>
      </Tabs>
    </div>
  );
};

export default TaskDetail;
