import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Modal,
  Box,
  Typography,
  Switch,
  Snackbar,
  Alert,
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Ticket interface matches backend model
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  engineer_name: string;
  company_name: string;
  created_at: string;
  updated_at: string;
}

// Component displaying tickets with filters, creation modal, and comments panel
const TicketsDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filtered, setFiltered] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  // Modal for creating tickets
  const [openModal, setOpenModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'low',
    engineer_name: '',
    company_name: '',
  });

  // Dark mode toggle
  const [darkMode, setDarkMode] = useState(false);

  // Snackbar for notifications
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get<Ticket[]>('/tickets');
      setTickets(res.data);
      setFiltered(res.data);
    } catch (e) {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever inputs change
  useEffect(() => {
    let data = [...tickets];
    if (searchTerm) data = data.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter) data = data.filter(t => t.status === statusFilter);
    if (priorityFilter) data = data.filter(t => t.priority === priorityFilter);
    if (engineerFilter) data = data.filter(t => t.engineer_name === engineerFilter);
    if (companyFilter) data = data.filter(t => t.company_name === companyFilter);
    setFiltered(data);
  }, [tickets, searchTerm, statusFilter, priorityFilter, engineerFilter, companyFilter]);

  // Handle ticket creation
  const handleCreate = async () => {
    const { title, description, engineer_name, company_name } = newTicket;
    if (!title || !description || !engineer_name || !company_name) {
      setToast({ open: true, message: 'Please fill all fields', severity: 'error' });
      return;
    }
    try {
      await axios.post('/tickets', newTicket);
      setToast({ open: true, message: 'Ticket created', severity: 'success' });
      setOpenModal(false);
      fetchTickets();
      setNewTicket({ title: '', description: '', status: 'open', priority: 'low', engineer_name: '', company_name: '' });
    } catch (e) {
      setToast({ open: true, message: 'Creation failed', severity: 'error' });
    }
  };

  // Toggle dark mode (Tailwind dark class)
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'priority', headerName: 'Priority', width: 120 },
    { field: 'engineer_name', headerName: 'Engineer', width: 150 },
    { field: 'company_name', headerName: 'Company', width: 150 },
    { field: 'created_at', headerName: 'Created At', width: 180 },
  ];

  return (
    <Box className="p-4 space-y-4">
      {/* Header with create button and theme switch */}
      <Box className="flex justify-between items-center">
        <Typography variant="h4">Tickets Dashboard</Typography>
        <Box className="flex items-center space-x-4">
          <Typography>Dark Mode</Typography>
          <Switch checked={darkMode} onChange={toggleDarkMode} />
          <Button variant="contained" onClick={() => setOpenModal(true)}>New Ticket</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <TextField label="Search Title" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Priority</InputLabel>
          <Select value={priorityFilter} label="Priority" onChange={e => setPriorityFilter(e.target.value)}>
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Engineer" value={engineerFilter} onChange={e => setEngineerFilter(e.target.value)} />
        <TextField label="Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} />
      </Box>

      {/* Tickets table */}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          getRowId={row => row.id}
        />
      </Box>

      {/* Create Ticket Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box className="bg-white dark:bg-gray-800 p-6 m-auto rounded-lg max-w-lg mt-20">
          <Typography variant="h6">New Ticket</Typography>
          <TextField
            label="Title"
            fullWidth
            className="mt-4"
            value={newTicket.title}
            onChange={e => setNewTicket({ ...newTicket, title: e.target.value })}
          />
          <Typography className="mt-4">Description</Typography>
          <ReactQuill
            theme="snow"
            value={newTicket.description}
            onChange={val => setNewTicket({ ...newTicket, description: val })}
          />
          <FormControl fullWidth className="mt-4">
            <InputLabel>Status</InputLabel>
            <Select
              value={newTicket.status}
              label="Status"
              onChange={e => setNewTicket({ ...newTicket, status: e.target.value })}
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth className="mt-4">
            <InputLabel>Priority</InputLabel>
            <Select
              value={newTicket.priority}
              label="Priority"
              onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Engineer Name"
            fullWidth
            className="mt-4"
            value={newTicket.engineer_name}
            onChange={e => setNewTicket({ ...newTicket, engineer_name: e.target.value })}
          />
          <TextField
            label="Company Name"
            fullWidth
            className="mt-4"
            value={newTicket.company_name}
            onChange={e => setNewTicket({ ...newTicket, company_name: e.target.value })}
          />
          <Button variant="contained" className="mt-6" onClick={handleCreate}>
            Submit
          </Button>
        </Box>
      </Modal>

      {/* Notification toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default TicketsDashboard;