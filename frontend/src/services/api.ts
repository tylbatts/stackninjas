import axios from 'axios';
import keycloak from '../keycloak';

// Axios instance for API calls
// Axios instance for API calls (public)
// Use relative URL if VITE_API_URL is not set
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use(
  (config: any) => {
    const token = keycloak.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

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

export default {
  getTickets: async (): Promise<Ticket[]> => {
    const res = await api.get('/tickets');
    return res.data;
  },
  getTicket: async (id: string): Promise<Ticket> => {
    const res = await api.get(`/tickets/${id}`);
    return res.data;
  },
  createTicket: async (data: { title: string; description: string }): Promise<Ticket> => {
    const res = await api.post('/tickets', data);
    return res.data;
  },
  addComment: async (ticketId: string, data: { text: string }): Promise<Comment> => {
    const res = await api.post(`/tickets/${ticketId}/comments`, data);
    return res.data;
  },
};