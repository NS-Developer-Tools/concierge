'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MAINTENANCE_ITEMS, getSeasonColor } from '@/lib/maintenance-data';
import Link from 'next/link';

export default function NewClientPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectAllInGroup(ids: string[]) {
    setSelectedServices((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id));
      }
      return [...new Set([...prev, ...ids])];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Client name is required');
      return;
    }

    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('clients').insert({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      services: selectedServices,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push('/');
  }

  // Group items by season
  const grouped = {
    spring: MAINTENANCE_ITEMS.filter((i) => i.season === 'spring'),
    summer: MAINTENANCE_ITEMS.filter((i) => i.season === 'summer'),
    fall: MAINTENANCE_ITEMS.filter((i) => i.season === 'fall'),
    winter: MAINTENANCE_ITEMS.filter((i) => i.season === 'winter'),
    recurring: MAINTENANCE_ITEMS.filter((i) => i.season === 'recurring'),
  };

  const seasonLabels: Record<string, string> = {
    spring: 'Spring (March – May)',
    summer: 'Summer (June – August)',
    fall: 'Fall (September – November)',
    winter: 'Winter (December – February)',
    recurring: 'Recurring / Ongoing',
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="text-primary hover:text-primary-semi-dark text-sm font-medium">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-2">Add New Client</h1>
        <p className="text-neutral mt-1">
          Enter client information and select applicable home services
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Client Info */}
        <div className="bg-white rounded-xl border border-base-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Client Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="John & Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="client@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="(317) 555-0123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="123 Main St, Indianapolis, IN"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-base-light bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Any relevant notes about the property or client..."
            />
          </div>
        </div>

        {/* Service Selection */}
        <div className="bg-white rounded-xl border border-base-light p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Home Services</h2>
          <p className="text-sm text-neutral mb-6">
            Select the maintenance services applicable to this home. These will be used to generate
            seasonal reminders for proactive outreach.
          </p>

          {Object.entries(grouped).map(([season, items]) => (
            <div key={season} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeasonColor(
                      season as 'spring' | 'summer' | 'fall' | 'winter' | 'recurring'
                    )}`}
                  >
                    {seasonLabels[season]}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => selectAllInGroup(items.map((i) => i.id))}
                  className="text-xs text-primary hover:text-primary-semi-dark font-medium"
                >
                  {items.every((i) => selectedServices.includes(i.id))
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedServices.includes(item.id)
                        ? 'border-primary bg-primary-ultra-light'
                        : 'border-base-light hover:border-primary-light'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(item.id)}
                      onChange={() => toggleService(item.id)}
                      className="mt-0.5 w-4 h-4 rounded border-base-light text-primary focus:ring-primary"
                    />
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

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-semi-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Add Client'}
          </button>
          <Link href="/" className="text-neutral hover:text-foreground font-medium">
            Cancel
          </Link>
          {selectedServices.length > 0 && (
            <span className="text-sm text-neutral">
              {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
