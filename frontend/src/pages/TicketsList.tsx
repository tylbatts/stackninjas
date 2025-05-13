import { useTicketContext } from '../context/TicketContext';
import { Badge } from '../components/ui/Badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TicketsList() {
  const { state } = useTicketContext();
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
        My Tickets
      </h2>
      {state.tickets.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No tickets found.
        </p>
      ) : (
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left">
              {['ID', 'Title', 'Status', 'Created At'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.tickets.map((ticket) => (
              <motion.tr
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="border-t hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                whileHover={{ scale: 1.01 }}
              >
                <td className="px-4 py-2">{ticket.id}</td>
                <td className="px-4 py-2">{ticket.title}</td>
                <td className="px-4 py-2">
                  <Badge variant={ticket.status} />
                </td>
                <td className="px-4 py-2">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
  