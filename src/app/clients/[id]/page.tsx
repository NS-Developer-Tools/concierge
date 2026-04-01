'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Client, Communication, ServiceCompletion, CustomService } from '@/lib/types';
import {
  MAINTENANCE_ITEMS,
  getRecommendedItems,
  getSeasonColor,
  getCurrentSeason,
  getSeasonLabel,
} from '@/lib/maintenance-data';
import Link from 'next/link';

const SEASON_OPTIONS = [
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'recurring', label: 'Recurring' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const SEASON_LABELS: Record<string, string> = {
  spring: 'Spring (March – May)',
  summer: 'Summer (June – August)',
  fall: 'Fall (September – November)',
  winter: 'Winter (December – February)',
  recurring: 'Recurring / Ongoing',
};

const GROUPED_ITEMS = {
  spring: MAINTENANCE_ITEMS.filter((i) => i.season === 'spring'),
  summer: MAINTENANCE_ITEMS.filter((i) => i.season === 'summer'),
  fall:   MAINTENANCE_ITEMS.filter((i) => i.season === 'fall'),
  winter: MAINTENANCE_ITEMS.filter((i) => i.season === 'winter'),
  recurring: MAINTENANCE_ITEMS.filter((i) => i.season === 'recurring'),
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [completions, setCompletions] = useState<ServiceCompletion[]>([]);
  const [customServices, setCustomServices] = useState<CustomService[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Edit Client modal ──────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    services: [] as string[],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Add/Edit custom service modal ──────────────────────────────────────────
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<CustomService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    season: 'recurring',
    frequency: '',
    active_months: [] as number[],
  });
  const [savingService, setSavingService] = useState(false);

  // ── Unsubscribe confirm ────────────────────────────────────────────────────
  const [unsubscribeTarget, setUnsubscribeTarget] = useState<{ id: string; name: string } | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  useEffect(() => {
    loadClient();
    loadCommunications();
    loadCompletions();
    loadCustomServices();
  }, [id]);

  // ── Data loaders ───────────────────────────────────────────────────────────
  async function loadClient() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) { router.push('/'); return; }
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

  async function loadCompletions() {
    const { data } = await supabase
      .from('service_completions')
      .select('*')
      .eq('client_id', id)
      .eq('completed_month', currentMonth)
      .eq('completed_year', currentYear);
    setCompletions(data || []);
  }

  async function loadCustomServices() {
    const { data } = await supabase
      .from('custom_services')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: true });
    setCustomServices(data || []);
  }

  // ── Edit client ────────────────────────────────────────────────────────────
  function openEditClient() {
    if (!client) return;
    setEditForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      services: [...client.services],
    });
    setShowEditModal(true);
  }

  function toggleEditService(serviceId: string) {
    setEditForm((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  }

  function selectAllInGroup(ids: string[]) {
    setEditForm((prev) => {
      const allSelected = ids.every((id) => prev.services.includes(id));
      return {
        ...prev,
        services: allSelected
          ? prev.services.filter((s) => !ids.includes(s))
          : [...new Set([...prev.services, ...ids])],
      };
    });
  }

  async function saveClientEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from('clients')
      .update({
        name: editForm.name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        notes: editForm.notes.trim() || null,
        services: editForm.services,
      })
      .eq('id', id);

    if (!error) {
      setShowEditModal(false);
      loadClient();
    }
    setSavingEdit(false);
  }

  // ── Unsubscribe service ────────────────────────────────────────────────────
  function promptUnsubscribe(serviceId: string, serviceName: string) {
    setUnsubscribeTarget({ id: serviceId, name: serviceName });
  }

  async function confirmUnsubscribe() {
    if (!client || !unsubscribeTarget) return;
    const updated = client.services.filter((s) => s !== unsubscribeTarget.id);
    await supabase.from('clients').update({ services: updated }).eq('id', id);
    setUnsubscribeTarget(null);
    loadClient();
  }

  // ── Service completion ─────────────────────────────────────────────────────
  async function toggleCompletion(serviceId: string) {
    const existing = completions.find((c) => c.service_id === serviceId);
    if (existing) {
      await supabase.from('service_completions').delete().eq('id', existing.id);
    } else {
      await supabase.from('service_completions').insert({
        client_id: id,
        service_id: serviceId,
        completed_month: currentMonth,
        completed_year: currentYear,
      });
    }
    loadCompletions();
  }

  function isCompleted(serviceId: string) {
    return completions.some((c) => c.service_id === serviceId);
  }

  // ── Log communication ──────────────────────────────────────────────────────
  async function logCommunication(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('communications').insert({
      client_id: id,
      note: newNote.trim(),
      communicated_at: new Date().toISOString(),
    });
    if (!error) { setNewNote(''); loadCommunications(); }
    setSaving(false);
  }

  // ── Delete client ──────────────────────────────────────────────────────────
  async function deleteClient() {
    setDeleting(true);
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) router.push('/');
    setDeleting(false);
  }

  // ── Custom service CRUD ────────────────────────────────────────────────────
  function openAddService() {
    setEditingService(null);
    setServiceForm({ name: '', description: '', season: 'recurring', frequency: '', active_months: [] });
    setShowServiceModal(true);
  }

  function openEditService(svc: CustomService) {
    setEditingService(svc);
    setServiceForm({
      name: svc.name,
      description: svc.description || '',
      season: svc.season,
      frequency: svc.frequency || '',
      active_months: svc.active_months || [],
    });
    setShowServiceModal(true);
  }

  function computeNotifyMonths(activeMonths: number[]) {
    return activeMonths.map((m) => (m - 1 + 12) % 12);
  }

  async function saveCustomService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.name.trim()) return;
    setSavingService(true);

    const payload = {
      client_id: id,
      name: serviceForm.name.trim(),
      description: serviceForm.description.trim() || null,
      season: serviceForm.season,
      frequency: serviceForm.frequency.trim() || null,
      active_months: serviceForm.active_months,
      notify_months: computeNotifyMonths(serviceForm.active_months),
    };

    if (editingService) {
      await supabase.from('custom_services').update(payload).eq('id', editingService.id);
    } else {
      await supabase.from('custom_services').insert(payload);
    }

    setSavingService(false);
    setShowServiceModal(false);
    loadCustomServices();
  }

  async function deleteCustomService(svcId: string) {
    await supabase.from('custom_services').delete().eq('id', svcId);
    await supabase.from('service_completions').delete().eq('client_id', id).eq('service_id', `custom-${svcId}`);
    loadCustomServices();
    loadCompletions();
  }

  function toggleMonth(month: number) {
    setServiceForm((prev) => ({
      ...prev,
      active_months: prev.active_months.includes(month)
        ? prev.active_months.filter((m) => m !== month)
        : [...prev.active_months, month].sort((a, b) => a - b),
    }));
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  if (loading) return <div className="text-center py-12 text-neutral">Loading client...</div>;
  if (!client)  return <div className="text-center py-12 text-neutral">Client not found.</div>;

  const currentSeason = getCurrentSeason();
  const standardRecommended = getRecommendedItems(client.services);
  const customRecommended = customServices.filter(
    (svc) => svc.notify_months.includes(currentMonth) || svc.active_months.includes(currentMonth)
  );

  type RecommendedItem = {
    id: string; name: string; description: string;
    season: string; frequency?: string | null;
    isCustom: boolean; customServiceId?: string;
  };

  const recommendedItems: RecommendedItem[] = [
    ...standardRecommended.map((item) => ({
      id: item.id, name: item.name, description: item.description,
      season: item.season, frequency: item.frequency, isCustom: false,
    })),
    ...customRecommended.map((svc) => ({
      id: `custom-${svc.id}`, name: svc.name, description: svc.description || '',
      season: svc.season, frequency: svc.frequency, isCustom: true, customServiceId: svc.id,
    })),
  ];

  const allStandardServices = MAINTENANCE_ITEMS.filter((item) => client.services.includes(item.id));
  const completedCount = recommendedItems.filter((item) => isCompleted(item.id)).length;
  const lastComm = communications[0];
  const contactedThisMonth = lastComm
    ? (now.getTime() - new Date(lastComm.communicated_at).getTime()) / (1000 * 60 * 60 * 24) < 30
    : false;

  // ── Render ─────────────────────────────────────────────────────────────────
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
              {client.email   && <span>{client.email}</span>}
              {client.phone   && <span>{client.phone}</span>}
              {client.address && <span>{client.address}</span>}
            </div>
            {client.notes && <p className="text-sm text-neutral mt-2 italic">{client.notes}</p>}
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            {contactedThisMonth ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 rounded-full bg-green-500" />Contacted Recently
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />Needs Contact
              </span>
            )}
            <button
              onClick={openEditClient}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium border border-base-light bg-white hover:bg-base-ultra-light transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Client
            </button>
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
            <button onClick={deleteClient} disabled={deleting}
              className="px-4 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-white border border-base-light rounded-lg text-sm font-medium hover:bg-base-ultra-light">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Unsubscribe Confirmation */}
      {unsubscribeTarget && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-yellow-800">
            Remove <strong>{unsubscribeTarget.name}</strong> from this client&rsquo;s service list?
            It will no longer appear in their recommendations.
          </p>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <button onClick={confirmUnsubscribe}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700">
              Yes, Remove
            </button>
            <button onClick={() => setUnsubscribeTarget(null)}
              className="px-4 py-2 bg-white border border-base-light rounded-lg text-sm font-medium hover:bg-base-ultra-light">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-6">

          {/* Recommended This Month */}
          <div className="bg-white rounded-xl border border-base-light p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-foreground">Recommended This Month</h2>
              {recommendedItems.length > 0 && (
                <span className="text-xs font-medium text-neutral">
                  {completedCount}/{recommendedItems.length} discussed
                </span>
              )}
            </div>
            <p className="text-sm text-neutral mb-4">
              {getSeasonLabel(currentSeason)} &mdash; Check off items as you discuss them with the client
            </p>

            {recommendedItems.length > 0 && (
              <div className="w-full bg-base-ultra-light rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / recommendedItems.length) * 100}%` }}
                />
              </div>
            )}

            {recommendedItems.length === 0 ? (
              <p className="text-sm text-neutral py-4 text-center">
                No seasonal recommendations for this month based on selected services.
              </p>
            ) : (
              <div className="space-y-2">
                {recommendedItems.map((item) => {
                  const completed = isCompleted(item.id);
                  return (
                    <div key={item.id} className="group flex items-start gap-3 p-3 rounded-lg">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleCompletion(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white hover:border-primary'
                        }`}
                      >
                        {completed && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-0.5 flex-shrink-0 ${getSeasonColor(item.season as any)}`}>
                        {item.season === 'recurring' ? item.frequency : item.season}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${completed ? 'text-green-700 line-through' : 'text-foreground'}`}>
                            {item.name}
                          </p>
                          {item.isCustom && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Custom</span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${completed ? 'text-green-600' : 'text-neutral'}`}>
                          {item.description}
                        </p>
                      </div>

                      {/* Unsubscribe button — only for standard items */}
                      {!item.isCustom && (
                        <button
                          onClick={() => promptUnsubscribe(item.id, item.name)}
                          title="Remove this service from client"
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5 p-1 text-neutral hover:text-danger transition-all rounded"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* All Services */}
          <div className="bg-white rounded-xl border border-base-light p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                All Services ({allStandardServices.length + customServices.length})
              </h2>
              <button onClick={openAddService}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-semi-dark transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Custom Item
              </button>
            </div>

            {/* Custom services */}
            {customServices.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Custom Items</p>
                <div className="space-y-1.5">
                  {customServices.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-base-ultra-light group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{svc.name}</span>
                        {svc.frequency && <span className="text-xs text-primary">{svc.frequency}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getSeasonColor(svc.season as any)}`}>
                          {svc.season}
                        </span>
                        <button onClick={() => openEditService(svc)} title="Edit"
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral hover:text-primary transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteCustomService(svc.id)} title="Delete"
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral hover:text-danger transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard services */}
            {allStandardServices.length === 0 && customServices.length === 0 ? (
              <p className="text-sm text-neutral">No services selected for this client.</p>
            ) : allStandardServices.length > 0 && (
              <div>
                {customServices.length > 0 && (
                  <p className="text-xs font-semibold text-neutral uppercase tracking-wide mb-2">Standard Items</p>
                )}
                <div className="space-y-1.5">
                  {allStandardServices.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-base-ultra-light group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                        {item.frequency && <span className="text-xs text-primary">{item.frequency}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getSeasonColor(item.season)}`}>
                          {item.season}
                        </span>
                        <button
                          onClick={() => promptUnsubscribe(item.id, item.name)}
                          title="Remove from client"
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral hover:text-danger transition-all"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
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
                <button type="submit" disabled={saving || !newNote.trim()}
                  className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-semi-dark transition-colors disabled:opacity-50">
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
              <p className="text-sm text-neutral py-4 text-center">No communications logged yet.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {communications.map((comm) => (
                  <div key={comm.id} className="p-3 rounded-lg bg-base-ultra-light border border-base-light">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-primary">
                        {new Date(comm.communicated_at).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-neutral">
                        {new Date(comm.communicated_at).toLocaleTimeString('en-US', {
                          hour: 'numeric', minute: '2-digit',
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

      {/* ══ Edit Client Modal ══════════════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-base-light flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">Edit Client</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral hover:text-foreground p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={saveClientEdit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Client Name <span className="text-danger">*</span>
                      </label>
                      <input type="text" value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                      <input type="email" value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="client@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                      <input type="tel" value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="(317) 555-0123" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                      <input type="text" value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="123 Main St, Indianapolis, IN" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                    <textarea value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      placeholder="Any relevant notes about the property or client..." />
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-foreground">Home Services</h4>
                    <span className="text-xs text-neutral">{editForm.services.length} selected</span>
                  </div>

                  {Object.entries(GROUPED_ITEMS).map(([season, items]) => (
                    <div key={season} className="mb-5 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeasonColor(season as any)}`}>
                          {SEASON_LABELS[season]}
                        </span>
                        <button type="button"
                          onClick={() => selectAllInGroup(items.map((i) => i.id))}
                          className="text-xs text-primary hover:text-primary-semi-dark font-medium">
                          {items.every((i) => editForm.services.includes(i.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items.map((item) => (
                          <label key={item.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                              editForm.services.includes(item.id)
                                ? 'border-primary bg-primary-ultra-light'
                                : 'border-base-light hover:border-primary-light'
                            }`}>
                            <input type="checkbox"
                              checked={editForm.services.includes(item.id)}
                              onChange={() => toggleEditService(item.id)}
                              className="mt-0.5 w-4 h-4 rounded border-base-light text-primary focus:ring-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-neutral mt-0.5">{item.description}</p>
                              {item.frequency && (
                                <p className="text-xs text-primary font-medium mt-1">{item.frequency}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-base-light flex-shrink-0">
                <button type="submit" disabled={savingEdit || !editForm.name.trim()}
                  className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-semi-dark transition-colors disabled:opacity-50">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 bg-white border border-base-light rounded-lg text-sm font-medium hover:bg-base-ultra-light">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Add/Edit Custom Service Modal ═════════════════════════════════════ */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {editingService ? 'Edit Custom Service' : 'Add Custom Service'}
              </h3>

              <form onSubmit={saveCustomService} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Service Name <span className="text-danger">*</span>
                  </label>
                  <input type="text" value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g., Generator Maintenance"
                    className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground placeholder-neutral focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Brief description of the service..." rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground placeholder-neutral focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Season</label>
                  <div className="flex flex-wrap gap-2">
                    {SEASON_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button"
                        onClick={() => setServiceForm({ ...serviceForm, season: opt.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          serviceForm.season === opt.value
                            ? `${getSeasonColor(opt.value as any)} border-transparent`
                            : 'bg-white border-base-light text-neutral hover:bg-base-ultra-light'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Frequency <span className="text-xs text-neutral">(optional)</span>
                  </label>
                  <input type="text" value={serviceForm.frequency}
                    onChange={(e) => setServiceForm({ ...serviceForm, frequency: e.target.value })}
                    placeholder="e.g., Monthly, Annually, Every 6 Months"
                    className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground placeholder-neutral focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Active Months <span className="text-xs text-neutral">(when to recommend)</span>
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTH_NAMES.map((name, idx) => (
                      <button key={idx} type="button" onClick={() => toggleMonth(idx)}
                        className={`px-2 py-1.5 rounded text-xs font-medium border transition-all ${
                          serviceForm.active_months.includes(idx)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white border-base-light text-neutral hover:bg-base-ultra-light'
                        }`}>
                        {name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral mt-1">Clients will be notified 30 days before each active month.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={savingService || !serviceForm.name.trim()}
                    className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-semi-dark transition-colors disabled:opacity-50">
                    {savingService ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                  </button>
                  <button type="button" onClick={() => setShowServiceModal(false)}
                    className="px-6 py-2.5 bg-white border border-base-light rounded-lg text-sm font-medium hover:bg-base-ultra-light">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
