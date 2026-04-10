import { configureStore } from '@reduxjs/toolkit';
import authReducer    from '../features/auth/authSlice';
import eventsReducer  from '../features/events/eventsSlice';
import bookingsReducer from '../features/bookings/bookingsSlice';
import { authApi }    from '../features/auth/authApi';
import { eventsApi }  from '../features/events/eventsApi';
import { bookingsApi } from '../features/bookings/bookingsApi';
import { paymentsApi } from '../features/payments/paymentsApi';

export const store = configureStore({
  reducer: {
    auth:      authReducer,
    events:    eventsReducer,
    bookings:  bookingsReducer,
    [authApi.reducerPath]:     authApi.reducer,
    [eventsApi.reducerPath]:   eventsApi.reducer,
    [bookingsApi.reducerPath]: bookingsApi.reducer,
    [paymentsApi.reducerPath]: paymentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      eventsApi.middleware,
      bookingsApi.middleware,
      paymentsApi.middleware,
    ),
});

export default store;
