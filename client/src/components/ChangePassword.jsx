import { Dialog } from "@headlessui/react";
import React from "react";
import { useForm } from "react-hook-form";
import Button from "./Button";
import Loading from "./Loading";
import ModalWrapper from "./ModalWrapper";
import Textbox from "./Textbox";
import { useChangePasswordMutation } from "../redux/slices/api/userApiSlice";
import { toast } from "sonner";

const ChangePassword = ({ open, setOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [changeUserPassword, { isLoading }] = useChangePasswordMutation();

  const handleOnSubmit = async (data) => {
    if (data.password !== data.cpass) {
      toast.warning("Las contraseñas no coinciden");
      return;
    }
    try {
      const res = await changeUserPassword(data).unwrap();
      toast.success("Contraseña cambiada exitosamente");

      setTimeout(() => {
        setOpen(false);
      }, 1500);
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
            className='text-base font-bold leading-6 text-gray-900 mb-4'
          >
            Cambiar Contraseña
          </Dialog.Title>
          <div className='mt-2 flex flex-col gap-6'>
            <Textbox
              placeholder='Nueva Contraseña'
              type='password'
              name='password'
              label='Nueva Contraseña'
              className='w-full rounded'
              register={register("password", {
                required: "Nueva Contraseña es requerida!",
              })}
              error={errors.password ? errors.password.message : ""}
            />
            <Textbox
              placeholder='Confirmar Nueva Contraseña'
              type='password'
              name='cpass'
              label='Confirmar Nueva Contraseña'
              className='w-full rounded'
              register={register("cpass", {
                required: "Confirmar Nueva Contraseña es requerido!",
              })}
              error={errors.cpass ? errors.cpass.message : ""}
            />
          </div>

          {isLoading ? (
            <div className='py-5'>
              <Loading />
            </div>
          ) : (
            <div className='py-3 mt-4 sm:flex sm:flex-row-reverse'>
              <Button
                type='submit'
                className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto'
                label='Guardar'
              />

              <button
                type='button'
                className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
                onClick={() => setOpen(false)}
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
      </ModalWrapper>
    </>
  );
};

export default ChangePassword;
