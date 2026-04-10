import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE = import.meta.env.VITE_API_URL;

export const bookingsApi = createApi({
  reducerPath: 'bookingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE}/api/bookings`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Booking'],
  endpoints: (build) => ({
    createBooking: build.mutation({
      query: (body) => ({ url: '/', method: 'POST', body }),
      invalidatesTags: ['Booking'],
    }),
    getUserBookings: build.query({
      query: () => '/my',
      providesTags: ['Booking'],
    }),
    getBookingById: build.query({
      query: (id) => `/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),
    cancelBooking: build.mutation({
      query: (id) => ({ url: `/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: ['Booking'],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
} = bookingsApi;
