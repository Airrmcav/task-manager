import { Dialog } from "@headlessui/react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateSubTaskMutation } from "../../redux/slices/api/taskApiSlice";
import Button from "../Button";
import Loading from "../Loading";
import ModalWrapper from "../ModalWrapper";
import Textbox from "../Textbox";

const AddSubTask = ({ open, setOpen, id }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [addSbTask, { isLoading }] = useCreateSubTaskMutation();

  const handleOnSubmit = async (data) => {
    try {
      const res = await addSbTask({ data, id }).unwrap();

      toast.success(res.message);

      setTimeout(() => {
        setOpen(false);
      }, 500);
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <>
      <ModalWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)} className=''>
          <Dialog.Title
            as='h2'
            className='text-base font-bold leading-6 text-gray-900 mb-4 uppercase'
          >
            Agregar Sub-Tarea
          </Dialog.Title>
          <div className='mt-2 flex flex-col gap-6'>
            <Textbox
              placeholder='Sub-Task title'
              type='text'
              name='title'
              label='Titulo'
              className='w-full rounded'
              register={register("title", {
                required: "Titulo es requerido!",
              })}
              error={errors.title ? errors.title.message : ""}
            />

            <div className='flex items-center gap-4'>
              <Textbox
                placeholder='Fecha'
                type='date'
                name='date'
                label='Fecha'
                className='w-full rounded'
                register={register("date", {
                  required: "Fecha es requerida!",
                })}
                error={errors.date ? errors.date.message : ""}
              />
              <Textbox
                placeholder='Etiqueta'
                type='text'
                name='tag'
                label='Etiqueta'
                className='w-full rounded'
                register={register("tag", {
                  required: "Etiqueta es requerida!",
                })}
                error={errors.tag ? errors.tag.message : ""}
              />
            </div>
          </div>
          {isLoading ? (
            <div className='mt-8'>
              <Loading />
            </div>
          ) : (
            <div className='py-3 mt-4 flex sm:flex-row-reverse gap-4'>
              <Button
                type='submit'
                className='bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 sm:ml-3 sm:w-auto'
                label='Agregar Sub-Tarea'
              />

              <Button
                type='button'
                className='bg-white border text-sm font-semibold text-gray-900 sm:w-auto'
                onClick={() => setOpen(false)}
                label='Cancelar'
              />
            </div>
          )}
        </form>
      </ModalWrapper>
    </>
  );
};

export default AddSubTask;
