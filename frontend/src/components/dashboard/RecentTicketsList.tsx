import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Ticket } from '../../context/TicketContext';

interface Props {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

export default function RecentTicketsList({ tickets, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'Open' | 'In Progress' | 'Closed'
  >('All');

  const filtered = useMemo(() => {
    if (!Array.isArray(tickets)) return [];
    return tickets.filter((ticket) => {
      const matchesSearch = ticket.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === 'All' || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="w-full">
        <CardHeader className="flex-col items-start">
          <div className="w-full flex justify-between items-center mb-2">
            <CardTitle>Your Recent Tickets</CardTitle>
            <Link
              to="/tickets"
              className="text-indigo-600 hover:underline text-sm"
            >
              View All
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0"
          >
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <select
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as any)
              }
            >
              <option>All</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Closed</option>
            </select>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No results found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      ID
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Title
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket) => (
                    <motion.tr
                      key={ticket.id}
                      onClick={() => onSelect(ticket)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      whileHover={{ scale: 1.01 }}
                    >
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {ticket.id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {ticket.title}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        <Badge variant={ticket.status} />
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}