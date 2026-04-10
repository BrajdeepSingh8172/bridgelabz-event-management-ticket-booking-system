import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE = import.meta.env.VITE_API_URL;

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE}/api/auth`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (build) => ({
    register: build.mutation({
      query: (body) => ({ url: '/register', method: 'POST', body }),
    }),
    login: build.mutation({
      query: (body) => ({ url: '/login', method: 'POST', body }),
    }),
    logout: build.mutation({
      query: () => ({ url: '/logout', method: 'POST' }),
    }),
    refreshToken: build.mutation({
      query: () => ({ url: '/refresh-token', method: 'POST' }),
    }),
    getMe: build.query({
      query: () => '/../users/profile',
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
} = authApi;
