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
      transformResponse: (res) => res.data || res,
    }),
    login: build.mutation({
      query: (body) => ({ url: '/login', method: 'POST', body }),
      transformResponse: (res) => res.data || res,
    }),
    logout: build.mutation({
      query: () => ({ url: '/logout', method: 'POST' }),
      transformResponse: (res) => res.data || res,
    }),
    refreshToken: build.mutation({
      query: () => ({ url: '/refresh-token', method: 'POST' }),
      transformResponse: (res) => res.data || res,
    }),
    getMe: build.query({
      // Use full URL to reach /api/users/profile (different base from /api/auth)
      query: () => ({ url: `${BASE}/api/users/profile` }),
      transformResponse: (res) => res.data || res,
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
