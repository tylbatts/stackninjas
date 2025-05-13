import { useState } from 'react';
import { useTicketContext, Ticket } from '../context/TicketContext';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import TicketSubmissionCard from '../components/dashboard/TicketSubmissionCard';
import RecentTicketsList from '../components/dashboard/RecentTicketsList';
import TicketDetailPreview from '../components/dashboard/TicketDetailPreview';
import { AnimatePresence } from 'framer-motion';


export default function Dashboard() {
  const { state } = useTicketContext();
  const tickets: Ticket[] = state.tickets;
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  return (
    <div className="p-4">
      <DashboardHeader />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketSubmissionCard />
        <RecentTicketsList
          tickets={tickets}
          onSelect={(t) => setSelectedTicket(t)}
        />
      </div>
      <AnimatePresence>
        <TicketDetailPreview
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      </AnimatePresence>
    </div>
  );
}
  