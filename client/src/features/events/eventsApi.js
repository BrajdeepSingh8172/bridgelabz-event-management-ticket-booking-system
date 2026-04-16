import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE = import.meta.env.VITE_API_URL;

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE}/api`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Event'],
  endpoints: (build) => ({
    getEvents: build.query({
      query: (params = {}) => ({
        url: '/events',
        params,
      }),
      transformResponse: (res) => res.data || res,
      providesTags: ['Event'],
    }),
    getFeaturedEvents: build.query({
      query: () => '/events/featured',
      transformResponse: (res) => res.data || res,
      providesTags: ['Event'],
    }),
    getEventById: build.query({
      query: (id) => `/events/${id}`,
      transformResponse: (res) => res.data || res,
      providesTags: (_r, _e, id) => [{ type: 'Event', id }],
    }),
    createEvent: build.mutation({
      query: (formData) => ({
        url: '/events',
        method: 'POST',
        body: formData,
      }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: ['Event'],
    }),
    updateEvent: build.mutation({
      query: ({ id, formData }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: formData,
      }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Event', id }, 'Event'],
    }),
    deleteEvent: build.mutation({
      query: (id) => ({ url: `/events/${id}`, method: 'DELETE' }),
      transformResponse: (res) => res.data || res,
      invalidatesTags: ['Event'],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useGetFeaturedEventsQuery,
  useGetEventByIdQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi;
