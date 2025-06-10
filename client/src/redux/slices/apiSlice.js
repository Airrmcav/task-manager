import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_APP_BASE_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api`,
  credentials: "include",
});

export const apiSlice = createApi({
  baseQuery,
  tagTypes: ['Tasks'],
  endpoints: (builder) => ({}),
});
