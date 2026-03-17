'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Client, Communication } from '@/lib/types';
import {
  MAINTENANCE_ITEMS,
  getRecommendedItems,
  getSeasonColor,
  getCurrentSeason,
  getSeasonLabel,
} from '@/lib/maintenance-data';
import Link from 'next/link';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadClient();
    loadCommunications();
  }, [id]);

  async function loadClient() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading client:', error);
      router.push('/');
      return;
    }
    setClient(data);
    setLoading(false);
  }

  async function loadCommunications() {
    const { data } = await supabase
      .from('communications')
      .select('*')
      .eq('client_id', id)
      .order('communicated_at', { ascending: false });

    setCommunications(data || []);
  }

  async function logCommunication(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSaving(true);
    const { error } = await supabase.from('communications').insert({
      client_id: id,
      note: newNote.trim(),
      communicated_at: new Date().toISOString(),
    });

    if (!error) {
      setNewNote('');
      loadCommunications();
    }
    setSaving(false);
  }

  async function deleteClient() {
    setDeleting(true);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      router.push('/');
    }
    setDeleting(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-neutral">Loading client...</div>;
  }

  if (!client) {
    return <div className="text-center py-12 text-neutral">Client not found.</div>;
  }

  const currentSeason = getCurrentSeason();
  const recommendedItems = getRecommendedItems(client.services);
  const allClientServices = MAINTENANCE_ITEMS.filter((item) =>
    client.services.includes(item.id)
  );

  // Check if contacted this month
  const now = new Date();
  const contactedThisMonth = communications.some((c) => {
    const d = new Date(c.communicated_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-primary hover:text-primary-semi-dark text-sm font-medium">
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral">
              {client.email && <span>{client.email}</span>}
              {client.phone && <span>{client.phone}</span>}
              {client.address && <span>{client.address}</span>}
            </div>
            {client.notes && (
              <p className="text-sm text-neutral mt-2 italic">{client.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {contactedThisMonth ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Contacted This Month
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Needs Contact
              </span>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-danger hover:text-red-700 font-medium"
            >
              Delete Client
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">
            Are you sure you want to delete <strong>{client.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={deleteClient}
              disabled={deleting}
              className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-white border border-base-light rounded-lg text-sm font-medium hover:bg-base-ultra-light"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Seasonal Recommendations */}
          <div className="bg-white rounded-xl border border-base-light p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Recommended This Month
            </h2>
            <p className="text-sm text-neutral mb-4">
              {getSeasonLabel(currentSeason)} &mdash; Items to discuss with client (includes 30-day advance notice)
            </p>

            {recommendedItems.length === 0 ? (
              <p className="text-sm text-neutral py-4 text-center">
                No seasonal recommendations for this month based on selected services.
              </p>
            ) : (
              <div className="space-y-2">
                {recommendedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-base-ultra-light"
                  >
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5 ${getSeasonColor(
                        item.season
                      )}`}
                    >
                      {item.season === 'recurring' ? item.frequency : item.season}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-neutral mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Subscribed Services */}
          <div className="bg-white rounded-xl border border-base-light p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              All Subscribed Services ({allClientServices.length})
            </h2>
            {allClientServices.length === 0 ? (
              <p className="text-sm text-neutral">No services selected for this client.</p>
            ) : (
              <div className="space-y-1.5">
                {allClientServices.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-base-ultra-light"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      {item.frequency && (
                        <span className="text-xs text-primary">{item.frequency}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${getSeasonColor(
                        item.season
                      )}`}
                    >
                      {item.season}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Communication */}
        <div className="space-y-6">
          {/* Log Communication */}
          <div className="bg-white rounded-xl border border-base-light p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Log Communication</h2>
            <form onSubmit={logCommunication}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                placeholder="Quick note about the communication..."
                className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground placeholder-neutral focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-neutral">
                  Date: {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <button
                  type="submit"
                  disabled={saving || !newNote.trim()}
                  className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-semi-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Logging...' : 'Log Communication'}
                </button>
              </div>
            </form>
          </div>

          {/* Communication History */}
          <div className="bg-white rounded-xl border border-base-light p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Communication History ({communications.length})
            </h2>

            {communications.length === 0 ? (
              <p className="text-sm text-neutral py-4 text-center">
                No communications logged yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {communications.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-lg bg-base-ultra-light border border-base-light"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-primary">
                        {new Date(comm.communicated_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-neutral">
                        {new Date(comm.communicated_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-foreground">{comm.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
