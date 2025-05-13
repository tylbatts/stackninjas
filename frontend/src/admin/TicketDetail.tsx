// Removed unused default React import under new JSX transform
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import adminApi from '../services/adminApi';

interface Comment {
  id: number;
  text: string;
  created_at: string;
}

interface Suggestion {
  id: number;
  error_snippet: string;
  suggestion_text: string;
}

interface TicketDetailData {
  id: number;
  title: string;
  description: string;
  status: string;
  created_at: string;
  comments: Comment[];
  suggestions: Suggestion[];
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetailData | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await adminApi.get<TicketDetailData>(`/tickets/${id}`);
        setTicket(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    if (id) fetchDetail();
  }, [id]);

  if (!ticket) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">{ticket.title}</h1>
      <p className="text-gray-700 dark:text-gray-200 mb-4">{ticket.description}</p>
      <div className="mb-4">
        <h2 className="font-semibold">Comments</h2>
        {ticket.comments.map((c) => (
          <div key={c.id} className="border p-2 my-2 rounded">
            <p>{c.text}</p>
            <span className="text-xs text-gray-500">{c.created_at}</span>
          </div>
        ))}
      </div>
      <div className="mb-4">
        <h2 className="font-semibold">Suggestions</h2>
        {ticket.suggestions.map((s) => (
          <div key={s.id} className="border p-2 my-2 rounded">
            <p className="font-semibold">{s.error_snippet}</p>
            <p>{s.suggestion_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}