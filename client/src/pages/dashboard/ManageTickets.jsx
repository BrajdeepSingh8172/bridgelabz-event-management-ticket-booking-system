import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useGetEventByIdQuery, eventsApi } from '../../features/events/eventsApi';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/ui/Button';
import Input  from '../../components/ui/Input';
import Modal  from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function ManageTickets() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data: eventResp, isLoading: isLoadingEvent } = useGetEventByIdQuery(id);
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // getEventById uses transformResponse so eventResp IS the event directly
  const event = eventResp;

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await axiosClient.get(`/api/tickets/event/${id}`);
      // ApiResponse shape: { success, data: [...tickets], message }
      const raw = res.data?.data ?? res.data;
      setTickets(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (id) fetchTickets();
  }, [id]);

  const handleOpenModal = (ticket = null) => {
    setEditing(ticket);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditing(null);
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      name: form.get('name'),
      price: Number(form.get('price')),
      totalQuantity: Number(form.get('capacity')),
      description: form.get('description'),
      event: id,
      type: 'general'
    };

    setSaving(true);
    try {
      if (editing) {
        await axiosClient.patch(`/api/tickets/${editing._id}`, data);
        toast.success('Ticket updated');
      } else {
        await axiosClient.post(`/api/tickets`, data);
        toast.success('Ticket added');
      }
      fetchTickets();
      handleCloseModal();
      // Invalidate event cache so detail page shows fresh tickets
      dispatch(eventsApi.util.invalidateTags([{ type: 'Event', id }, 'Event']));
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ticketId) => {
    if (!confirm('Delete this ticket?')) return;
    try {
      await axiosClient.delete(`/api/tickets/${ticketId}`);
      toast.success('Ticket deleted');
      fetchTickets();
      dispatch(eventsApi.util.invalidateTags([{ type: 'Event', id }, 'Event']));
    } catch {
      toast.error('Failed to delete ticket');
    }
  };

  if (isLoadingEvent || isLoadingTickets) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">Manage Tickets</h1>
          <p className="page-subtitle">Configure ticket types for {event?.title}</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="btn-md btn-primary gap-1.5">
          <PlusIcon className="w-4 h-4" /> Add Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="glass p-16 text-center">
          <p className="text-slate-400 mb-4">No tickets configured yet.</p>
          <Button onClick={() => handleOpenModal()} className="btn-md btn-secondary">
            Add First Ticket
          </Button>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-surface-border text-slate-400">
                <th className="px-5 py-3 font-medium">Ticket Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Sold</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-b border-surface-border/50 hover:bg-white/3">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{t.name}</p>
                    {t.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{t.description}</p>}
                  </td>
                  <td className="px-4 py-4 text-slate-300">{formatCurrency(t.price)}</td>
                  <td className="px-4 py-4 text-slate-300">{t.totalQuantity}</td>
                  <td className="px-4 py-4 text-slate-300">{t.soldQuantity}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenModal(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-300 hover:bg-primary-500/20">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editing ? 'Edit Ticket' : 'Add Ticket'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="tkt-name" name="name" label="Name" required defaultValue={editing?.name} placeholder="Early Bird" />
          <div className="grid grid-cols-2 gap-4">
            <Input id="tkt-price" name="price" label="Price (₹)" type="number" min="0" required defaultValue={editing?.price ?? 0} />
            <Input id="tkt-cap" name="capacity" label="Capacity" type="number" min="1" required defaultValue={editing?.totalQuantity ?? 100} />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea name="description" rows={2} className="input resize-none" defaultValue={editing?.description} placeholder="Access to front rows" />
          </div>
          <div className="flex gap-3 pt-3">
            <Button type="submit" loading={saving} className="w-full btn-md btn-primary">Save Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
