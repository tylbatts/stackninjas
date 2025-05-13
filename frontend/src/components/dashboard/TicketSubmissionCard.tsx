import { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../ui/Card';
import FloatingInput from '../FloatingInput';
import { useTicketContext } from '../../context/TicketContext';
import { useToast } from '../ui/Toast';

export default function TicketSubmissionCard() {
  const { createTicket } = useTicketContext();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');


  const isFormValid =
    title.trim() !== '' && description.trim() !== '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    try {
      await createTicket(title.trim(), description.trim());
      addToast('Ticket submitted!');
      setTitle('');
      setDescription('');
      setTags('');
    } catch (err) {
      console.error('Error submitting ticket', err);
      addToast('Failed to submit ticket. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Submit a New Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FloatingInput
              label="Title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Enter a concise summary of your ticket.
            </p>
            <FloatingInput
              label="Description"
              textarea
              rows={4}
              value={description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Provide detailed information about the issue or request.
            </p>
            <FloatingInput
              label="Tags"
              value={tags}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
            />
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Add comma-separated tags to help categorize (e.g., bug, feature).
            </p>
            <div className="text-right">
              <button
                type="submit"
                disabled={!isFormValid}
                className="bg-primary-600 text-white px-4 py-2 rounded-md disabled:opacity-50 active:scale-95 transition"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}