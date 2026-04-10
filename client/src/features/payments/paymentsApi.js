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
    }),
    verifyPayment: build.mutation({
      query: (body) => ({ url: '/verify', method: 'POST', body }),
    }),
    getPaymentById: build.query({
      query: (id) => `/${id}`,
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentByIdQuery,
} = paymentsApi;
