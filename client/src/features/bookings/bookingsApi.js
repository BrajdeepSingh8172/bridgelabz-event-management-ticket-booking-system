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
  tagTypes: ['Booking', 'CancellationRequest'],
  endpoints: (build) => ({
    createBooking: build.mutation({
      query: (body) => ({ url: '/', method: 'POST', body }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: ['Booking'],
    }),
    getUserBookings: build.query({
      query: () => '/my',
      transformResponse: (res) => res.data || res,
      providesTags: ['Booking'],
    }),
    getBookingById: build.query({
      query: (id) => `/${id}`,
      transformResponse: (res) => res.data || res,
      providesTags: (_r, _e, id) => [{ type: 'Booking', id }],
    }),
    cancelBooking: build.mutation({
      query: (id) => ({ url: `/${id}/cancel`, method: 'PATCH' }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: ['Booking'],
    }),

    // ── Cancellation workflow ──────────────────────────────────────────────────
    /** User requests cancellation with optional reason */
    requestCancellation: build.mutation({
      query: ({ bookingId, cancellationReason }) => ({
        url: `/${bookingId}/cancel-request`,
        method: 'POST',
        body: { cancellationReason },
      }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: ['Booking'],
    }),

    /** Admin fetches all pending cancellation requests */
    getPendingCancellations: build.query({
      query: () => '/cancellation-requests',
      transformResponse: (res) => res.data || res,
      providesTags: ['CancellationRequest'],
    }),

    /** Admin approves or rejects a cancellation request */
    adminCancellationDecision: build.mutation({
      query: ({ bookingId, decision, reason }) => ({
        url: `/${bookingId}/admin-decision`,
        method: 'POST',
        body: { decision, reason },
      }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: ['Booking', 'CancellationRequest'],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetUserBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
  useRequestCancellationMutation,
  useGetPendingCancellationsQuery,
  useAdminCancellationDecisionMutation,
} = bookingsApi;
