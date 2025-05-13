import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../services/adminApi';

interface Ticket {
  id: number;
  title: string;
  status: string;
  user_id: number;
  engineer_id: number | null;
  created_at: string;
}

interface TicketsListProps {
  unclaimed?: boolean;
  mine?: boolean;
}

export default function TicketsList({ unclaimed, mine }: TicketsListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      try {
        const params: any = {};
        if (unclaimed) params.unclaimed = true;
        if (mine) params.mine = true;
        const res = await adminApi.get<Ticket[]>('/tickets', { params });
        setTickets(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [unclaimed, mine]);

  const handleClaim = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const res = await adminApi.patch<Ticket>(`/tickets/${id}/claim`);
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? res.data : t))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to claim the ticket. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading tickets...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (tickets.length === 0) {
    return <div>No tickets available.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Tickets</h1>
      <table className="min-w-full bg-white dark:bg-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              onClick={() => navigate(`/admin/tickets/${t.id}`)}
            >
              <td className="border px-4 py-2">{t.id}</td>
              <td className="border px-4 py-2">{t.title}</td>
              <td className="border px-4 py-2">{t.status}</td>
              <td className="border px-4 py-2">
                {t.engineer_id ? (
                  <span className="text-gray-500">Claimed</span>
                ) : (
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={(e) => handleClaim(e, t.id)}
                  >
                    Claim
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}