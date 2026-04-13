import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE = import.meta.env.VITE_API_URL;

export const paymentsApi = createApi({
  reducerPath: 'paymentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE}/api/payments`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (build) => ({
    createOrder: build.mutation({
      query: (body) => ({ url: '/create-order', method: 'POST', body }),
      transformResponse: (res) => res.data || res,
    }),
    verifyPayment: build.mutation({
      query: (body) => ({ url: '/verify', method: 'POST', body }),
      transformResponse: (res) => res.data || res,
    }),
    getPaymentById: build.query({
      query: (id) => `/${id}`,
      transformResponse: (res) => res.data || res,
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentByIdQuery,
} = paymentsApi;
