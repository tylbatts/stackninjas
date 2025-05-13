// Removed unused default React import under new JSX transform
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import adminApi from '../services/adminApi';
// Vector suggestion interfaces
interface PastSuggestion {
  ticket_id: number;
  snippet: string;
  solved_at: string;
}

interface DocSuggestion {
  doc_id: string;
  filename: string;
  snippet: string;
  section_heading?: string;
  full_text: string;
}

interface VectorSuggestionsResponse {
  past: PastSuggestion[];
  docs: DocSuggestion[];
}

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
  const [vectorSuggest, setVectorSuggest] = useState<VectorSuggestionsResponse | null>(null);
  const [docModal, setDocModal] = useState<DocSuggestion | null>(null);
  const navigate = useNavigate();

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
  // Fetch vector-based suggestions when ticket is loaded
  useEffect(() => {
    async function fetchVector() {
      if (!ticket) return;
      try {
        const res = await adminApi.get<VectorSuggestionsResponse>(`/tickets/${id}/suggestions`);
        setVectorSuggest(res.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchVector();
  }, [ticket, id]);

  if (!ticket) return <div>Loading...</div>;

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="flex-1">
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
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="hidden lg:block w-full lg:w-1/3 bg-neutral-50 p-4 border-l border-primary-500 sticky top-0 h-screen overflow-auto"
      >
        <h2 className="text-xl font-semibold mb-4 text-primary-600">Suggestions</h2>
        {!vectorSuggest && <p>Loading suggestions...</p>}
        {vectorSuggest && (
          <>
            <Card className="mb-6 border-primary-500">
              <CardHeader>
                <CardTitle className="text-primary-600">Past Ticket Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vectorSuggest.past.map((ps) => (
                  <div key={ps.ticket_id} className="space-y-1">
                    <p className="text-sm text-gray-700">{ps.snippet}</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        className="text-primary-500 hover:underline p-0"
                        onClick={() => navigate(`/admin/tickets/${ps.ticket_id}`)}
                      >
                        View Original Ticket
                      </Button>
                      <Badge>Solved on {new Date(ps.solved_at).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-primary-500">
              <CardHeader>
                <CardTitle className="text-primary-600">Documentation Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vectorSuggest.docs.map((ds) => (
                  <div key={ds.doc_id} className="space-y-1">
                    {ds.section_heading && <p className="text-sm text-gray-500 italic">{ds.section_heading}</p>}
                    <p className="text-sm text-gray-700">{ds.snippet}</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        className="text-primary-500 hover:underline p-0"
                        onClick={() => setDocModal(ds)}
                      >
                        View in Docs
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
      {/* Modal for viewing full document chunk */}
      {docModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-2xl w-full h-3/4 overflow-auto">
            <h3 className="text-lg font-semibold mb-2">{docModal.filename}</h3>
            {docModal.section_heading && <h4 className="text-md font-medium mb-2">{docModal.section_heading}</h4>}
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
              {docModal.full_text}
            </pre>
            <div className="mt-4 text-right">
              <Button onClick={() => setDocModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}