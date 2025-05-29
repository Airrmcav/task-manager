import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Loading, Textbox } from "../components";
import { useLoginMutation } from "../redux/slices/api/authApiSlice";
import { setCredentials } from "../redux/slices/authSlice";
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Login = () => {
  const { user } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (data) => {
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials(res));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.data?.message || "Error al iniciar sesión.");
    }
  };

  useEffect(() => {
    user && navigate("/dashboard");
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-black">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 shadow-lg rounded-xl flex flex-col-reverse lg:flex-row overflow-hidden">
        {/* Texto lateral */}
        <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center items-start gap-4 bg-blue-700 dark:bg-slate-800 text-white">
        <div className="w-full flex items-center justify-center">
          <div className="flex items-center justify-center bg-white rounded-full w-24 h-24">
            <img
              src="/Icon.jpg"
              alt="Icon Logo"
              className="w-20 h-20 object-contain"
              />
          </div>
              </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Bienvenido de vuelta 👋
          </h1>
          <p className="text-base md:text-lg">
            Administra tus tareas fácilmente desde cualquier lugar.
          </p>
          <span className="mt-2 text-sm bg-white/20 px-3 py-1 rounded-full">
            Gestor de Actividades
          </span>
        </div>

        {/* Formulario */}
        <div className="w-full lg:w-1/2 p-10">
          <form
            onSubmit={handleSubmit(handleLogin)}
            className="flex flex-col gap-6"
          >
            <h2 className="text-2xl font-semibold text-center text-blue-700 dark:text-white">
              Iniciar Sesión
            </h2>

            <Textbox
              placeholder="ejemplo@example.com"
              type="email"
              name="email"
              label="Correo electrónico"
              className="w-full rounded-lg"
              register={register("email", {
                required: "Email es requerido",
              })}
              error={errors.email?.message}
            />

            <div className="relative">
              <Textbox
                placeholder="Contraseña"
                type={showPassword ? "text" : "password"}
                name="password"
                label="Contraseña"
                className="w-full rounded-lg"
                register={register("password", {
                  required: "Contraseña es requerida",
                })}
                error={errors.password?.message}
              />
              <button
                type="button"
                className="absolute right-3 top-[40px] text-lg text-blue-600 dark:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {isLoading ? (
              <Loading />
            ) : (
              <Button
                type="submit"
                label="Ingresar"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg"
              />
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
