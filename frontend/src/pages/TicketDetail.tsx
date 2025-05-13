import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { AnimatePresence, motion } from 'framer-motion';

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<import('../services/api').Ticket | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (ticketId) {
      api.getTicket(ticketId).then(setTicket).catch(console.error);
    }
  }, [ticketId]);
  if (!ticket) {
    return <div className="p-4">Loading...</div>;
  }

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !ticketId) return;
    try {
      const newComment = await api.addComment(ticketId, { text: comment.trim() });
      setTicket({ ...ticket, comments: [...ticket.comments, newComment] });
      setComment('');
    } catch (err) {
      console.error('Error adding comment', err);
    }
  };

  return (
    <div className="p-4">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link to="/dashboard" className="hover:underline">
          Dashboard
        </Link>{' '}
        ›{' '}
        <Link to="/tickets" className="hover:underline">
          My Tickets
        </Link>{' '}
        ›{' '}
        <span className="text-gray-700 dark:text-gray-300">
          {ticket.title}
        </span>
      </nav>

      <Card>
        <CardHeader className="justify-between">
          <CardTitle>{ticket.title}</CardTitle>
          <Badge variant={ticket.status} />
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-200 mb-2">
            {ticket.description}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created at: {new Date(ticket.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {ticket.comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border rounded p-3 bg-gray-50 dark:bg-gray-700"
              >
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {c.author}{' '}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({new Date(c.created_at).toLocaleString()})
                  </span>
                </div>
                <div className="mt-1 text-gray-700 dark:text-gray-200">
                  {c.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <form onSubmit={handleAddComment} className="space-y-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="text-right">
              <Button type="submit" disabled={!comment.trim()}>
                Add Comment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}