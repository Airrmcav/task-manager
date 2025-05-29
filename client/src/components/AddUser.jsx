import { Dialog } from "@headlessui/react";
import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { useRegisterMutation } from "../redux/slices/api/authApiSlice";
import { useUpdateUserMutation } from "../redux/slices/api/userApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { Button, Loading, ModalWrapper, Textbox } from "./";

const AddUser = ({ open, setOpen, userData }) => {
  let defaultValues = userData ?? {};
  const { user } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  const dispatch = useDispatch();

  const [addNewUser, { isLoading }] = useRegisterMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const handleOnSubmit = async (data) => {
    try {
      if (userData) {
        const res = await updateUser(data).unwrap();
        toast.success(res?.message);
        if (userData?._id === user?._id) {
          dispatch(setCredentials({ ...res?.user }));
        }
      } else {
        const res = await addNewUser({
          ...data,
          password: data?.email,
        }).unwrap();
        toast.success("Nuevo usuario agregado exitosamente");
      }

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
            className='text-base font-bold leading-6 text-gray-900 mb-5'
          >
            {userData ? "Actualizar Perfil" : "Agregar nuevo usuario"}
          </Dialog.Title>
          <div className='mt-2 flex flex-col gap-6'>
            <Textbox
              placeholder='Nombre completo'
              type='text'
              name='name'
              label='Nombre completo'
              className='w-full rounded'
              register={register("name", {
                required: "Nombre completo es requerido!",
              })}
              error={errors.name ? errors.name.message : ""}
            />
            <Textbox
              placeholder='Titulo'
              type='text'
              name='title'
              label='Titulo'
              className='w-full rounded'
              register={register("title", {
                required: "Titulo es requerido!",
              })}
              error={errors.title ? errors.title.message : ""}
            />
            <Textbox
              placeholder='Correo eléctronico'
              type='email'
              name='email'
              label='Correo eléctronico'
              className='w-full rounded'
              register={register("email", {
                required: "Correo eléctronico es requerido!",
              })}
              error={errors.email ? errors.email.message : ""}
            />

            <Textbox
              placeholder='Rol'
              type='text'
              name='role'
              label='Rol'
              className='w-full rounded'
              register={register("role", {
                required: "Rol es requerido!",
              })}
              error={errors.role ? errors.role.message : ""}
            />
          </div>

          {isLoading || isUpdating ? (
            <div className='py-5'>
              <Loading />
            </div>
          ) : (
            <div className='py-3 mt-4 sm:flex sm:flex-row-reverse'>
              <Button
                type='submit'
                className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto'
                label='Enviar'
              />

              <Button
                type='button'
                className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
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

export default AddUser;
