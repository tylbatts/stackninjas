import { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { useKeycloak } from '@react-keycloak/web';

export interface Comment {
  id: string;
  ticket_id: string;
  author: string;
  text: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: 'Open' | 'Closed';
  comments: Comment[];
}

interface State {
  tickets: Ticket[];
}

type Action =
  | { type: 'SET_TICKETS'; payload: Ticket[] }
  | { type: 'ADD_TICKET'; payload: Ticket }
  | { type: 'ADD_COMMENT'; payload: Comment };

interface TicketContextType {
  state: State;
  fetchTickets: () => Promise<void>;
  createTicket: (title: string, description: string) => Promise<void>;
  addComment: (ticketId: string, text: string) => Promise<void>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

const ticketReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_TICKETS':
      return { ...state, tickets: action.payload };
    case 'ADD_TICKET':
      return { ...state, tickets: [action.payload, ...state.tickets] };
    case 'ADD_COMMENT':
      return {
        ...state,
        tickets: state.tickets.map((t) =>
          t.id === action.payload.ticket_id
            ? { ...t, comments: [...t.comments, action.payload] }
            : t
        ),
      };
    default:
      return state;
  }
};

export const TicketProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(ticketReducer, { tickets: [] });
  const { keycloak, initialized } = useKeycloak();

  const fetchTickets = async () => {
    try {
      const tickets = await api.getTickets();
      dispatch({ type: 'SET_TICKETS', payload: tickets });
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    }
  };

  const createTicket = async (title: string, description: string) => {
    try {
      const newTicket = await api.createTicket({ title, description });
      dispatch({ type: 'ADD_TICKET', payload: newTicket });
    } catch (err) {
      console.error('Failed to create ticket', err);
      throw err;
    }
  };

  const addComment = async (ticketId: string, text: string) => {
    try {
      const newComment = await api.addComment(ticketId, { text });
      dispatch({ type: 'ADD_COMMENT', payload: newComment });
    } catch (err) {
      console.error('Failed to add comment', err);
      throw err;
    }
  };

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      fetchTickets();
    }
  }, [initialized, keycloak.authenticated]);

  return (
    <TicketContext.Provider value={{ state, fetchTickets, createTicket, addComment }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTicketContext = () => {
  const context = useContext(TicketContext);
  if (!context) {
    throw new Error('useTicketContext must be used within TicketProvider');
  }
  return context;
};