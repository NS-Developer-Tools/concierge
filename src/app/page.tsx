'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ClientWithLastContact } from '@/lib/types';
import Link from 'next/link';

export default function Dashboard() {
  const [clients, setClients] = useState<ClientWithLastContact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading clients:', error);
      setLoading(false);
      return;
    }

    const clientsWithContact: ClientWithLastContact[] = await Promise.all(
      (clientsData || []).map(async (client) => {
        const { data: comms } = await supabase
          .from('communications')
          .select('communicated_at')
          .eq('client_id', client.id)
          .order('communicated_at', { ascending: false })
          .limit(1);

        const lastContact = comms?.[0]?.communicated_at || null;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let contactedThisMonth = false;
        if (lastContact) {
          const contactDate = new Date(lastContact);
          contactedThisMonth =
            contactDate.getMonth() === currentMonth &&
            contactDate.getFullYear() === currentYear;
        }

        return {
          ...client,
          last_contact: lastContact,
          contacted_this_month: contactedThisMonth,
        };
      })
    );

    // Sort: not contacted this month first, then by name
    clientsWithContact.sort((a, b) => {
      if (a.contacted_this_month !== b.contacted_this_month) {
        return a.contacted_this_month ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    });

    setClients(clientsWithContact);
    setLoading(false);
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const needsContact = filtered.filter((c) => !c.contacted_this_month).length;
  const totalClients = filtered.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Client Dashboard</h1>
        <p className="text-neutral mt-1">
          Manage your Home Concierge clients and track outreach
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-base-light p-5">
          <p className="text-sm text-neutral">Total Clients</p>
          <p className="text-3xl font-bold text-foreground mt-1">{totalClients}</p>
        </div>
        <div className="bg-white rounded-xl border border-base-light p-5">
          <p className="text-sm text-neutral">Needs Contact This Month</p>
          <p className="text-3xl font-bold text-accent-gold mt-1">{needsContact}</p>
        </div>
        <div className="bg-white rounded-xl border border-base-light p-5">
          <p className="text-sm text-neutral">Contacted This Month</p>
          <p className="text-3xl font-bold text-accent-green mt-1">
            {totalClients - needsContact}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-base-light bg-white text-foreground placeholder-neutral focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="text-center py-12 text-neutral">Loading clients...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral mb-4">
            {search ? 'No clients found matching your search.' : 'No clients yet.'}
          </p>
          {!search && (
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-semi-dark transition-colors"
            >
              Add Your First Client
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-base-light overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-base-light bg-base-ultra-light">
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral uppercase tracking-wider">
                  Client Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral uppercase tracking-wider">
                  Last Contact
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral uppercase tracking-wider">
                  Services
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-base-light last:border-0 hover:bg-primary-ultra-light transition-colors"
                >
                  <td className="px-6 py-4">
                    {client.contacted_this_month ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-green">
                        <span className="w-2 h-2 rounded-full bg-accent-green" />
                        Contacted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-gold">
                        <span className="w-2 h-2 rounded-full bg-accent-gold" />
                        Needs Contact
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium text-primary hover:text-primary-semi-dark hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral">
                    {client.last_contact
                      ? new Date(client.last_contact).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral">
                    {client.services.length} service{client.services.length !== 1 ? 's' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
