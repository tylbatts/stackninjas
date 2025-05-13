import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ticket } from '../../context/TicketContext';
import { Button } from '../ui/Button';

interface Props {
  ticket: Ticket | null;
  onClose: () => void;
}

export default function TicketDetailPreview({
  ticket,
  onClose,
}: Props) {
  const [showAI, setShowAI] = useState(false);

  return (
    <AnimatePresence>
      {ticket && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween' }}
          className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-lg p-4 z-50"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Ticket #{ticket.id}
            </h2>
            <Button onClick={onClose}>Close</Button>
          </div>
          <div className="space-y-4 overflow-y-auto h-full pb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-1">
                {ticket.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-1">
                Description
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                {ticket.description}
              </p>
            </div>
            <div>
              <Button variant="ghost" onClick={() => setShowAI(!showAI)}>
                AI Suggestion {showAI ? '▲' : '▼'}
              </Button>
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-2 border border-gray-200 dark:border-gray-700 rounded"
                  >
                    <p className="text-gray-600 dark:text-gray-400">
                      AI suggestion content goes here...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}