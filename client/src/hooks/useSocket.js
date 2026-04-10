import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { eventsApi } from '../features/events/eventsApi';

export function useSocket() {
  const dispatch  = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] connected:', socket.id);
    });

    // Real-time ticket seat update
    socket.on('ticketUpdate', ({ eventId, ticketTypeId, remaining }) => {
      dispatch(
        eventsApi.util.updateQueryData('getEventById', eventId, (draft) => {
          if (!draft) return;
          const tickets = draft.tickets || draft.ticketTypes || [];
          const tkt = tickets.find(
            (t) => t._id === ticketTypeId || String(t._id) === String(ticketTypeId),
          );
          if (tkt) tkt.remaining = remaining;
        }),
      );
    });

    socket.on('disconnect', () => {
      console.log('[Socket] disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  return socketRef;
}
