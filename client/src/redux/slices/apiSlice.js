import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Definir la URL base directamente
const API_URL = "https://mcav-administrador-tareas.netlify.app/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['Tasks'], // Agregué 'Tasks' que podría ser necesario
  endpoints: (builder) => ({}),
});
