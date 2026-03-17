export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface MaintenanceItem {
  id: string;
  name: string;
  description: string;
  season: Season | 'recurring';
  frequency?: string;
  /** Months when this item is relevant (0-indexed: 0=Jan, 11=Dec) */
  activeMonths: number[];
  /** Months when we should notify (30 days before activeMonths) */
  notifyMonths: number[];
  category: string;
}

// Helper: given active months, compute notify months (1 month prior)
function notifyBefore(months: number[]): number[] {
  return months.map(m => (m - 1 + 12) % 12);
}

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  // ── Spring (March–May) ──
  {
    id: 'hvac-ac-tuneup',
    name: 'A/C Tune-Up',
    description: 'Schedule a professional A/C tune-up before the first 80°F day.',
    season: 'spring',
    activeMonths: [2, 3, 4], // Mar-May
    notifyMonths: notifyBefore([2, 3]),
    category: 'HVAC',
  },
  {
    id: 'gutters-spring',
    name: 'Spring Gutter Cleaning',
    description: 'Clean out debris from winter storms to prevent basement flooding during spring rains.',
    season: 'spring',
    activeMonths: [2, 3],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Gutters',
  },
  {
    id: 'roof-inspection',
    name: 'Roof Inspection',
    description: 'Inspect for shingle damage or ice dam remnants from winter.',
    season: 'spring',
    activeMonths: [2, 3, 4],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Roof',
  },
  {
    id: 'irrigation-open',
    name: 'Irrigation System Opening',
    description: 'De-winterize and open the sprinkler system; check for cracked heads.',
    season: 'spring',
    activeMonths: [3, 4],
    notifyMonths: notifyBefore([3, 4]),
    category: 'Irrigation',
  },
  {
    id: 'pool-open',
    name: 'Pool Opening',
    description: 'Remove the cover, balance chemicals, and start the filtration system.',
    season: 'spring',
    activeMonths: [4], // Late May
    notifyMonths: notifyBefore([4]),
    category: 'Pool',
  },
  {
    id: 'landscaping-spring',
    name: 'Landscape Clean-Up & Mulch',
    description: 'Landscape clean up and install mulch in mulch beds.',
    season: 'spring',
    activeMonths: [2, 3, 4],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Landscaping',
  },
  {
    id: 'lawn-treatments',
    name: 'Lawn Treatments',
    description: 'Start performing lawn treatments.',
    season: 'spring',
    activeMonths: [2, 3, 4],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Lawn',
  },
  {
    id: 'windows-doors-inspect',
    name: 'Windows & Doors Inspection',
    description: 'Inspect caulking and weatherstripping; swap storm windows for screens.',
    season: 'spring',
    activeMonths: [2, 3, 4],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Windows/Doors',
  },
  {
    id: 'sump-pump-spring',
    name: 'Spring Sump Pump Test',
    description: 'Test the pump and backup battery (critical for Indiana\'s wet springs).',
    season: 'spring',
    activeMonths: [2, 3],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Sump Pump',
  },
  {
    id: 'lawn-mowing-schedule',
    name: 'Lawn Mowing Schedule',
    description: 'Schedule with mowing and maintenance crew.',
    season: 'spring',
    activeMonths: [2, 3],
    notifyMonths: notifyBefore([2, 3]),
    category: 'Lawn Maintenance',
  },

  // ── Summer (June–August) ──
  {
    id: 'deck-patio',
    name: 'Deck/Patio Power Wash & Seal',
    description: 'Power wash and reseal or stain to protect against UV rays and humidity.',
    season: 'summer',
    activeMonths: [5, 6, 7],
    notifyMonths: notifyBefore([5, 6]),
    category: 'Deck/Patio',
  },
  {
    id: 'exterior-painting',
    name: 'Exterior Painting Touch-Up',
    description: 'Touch up any peeling paint to prevent wood rot.',
    season: 'summer',
    activeMonths: [5, 6, 7],
    notifyMonths: notifyBefore([5, 6]),
    category: 'Exterior',
  },
  {
    id: 'pest-control',
    name: 'Pest Control Treatment',
    description: 'Treat the perimeter for ants, spiders, and stinging insects.',
    season: 'summer',
    activeMonths: [5, 6, 7],
    notifyMonths: notifyBefore([5, 6]),
    category: 'Pest Control',
  },
  {
    id: 'air-filters-summer',
    name: 'Summer Air Filter Check',
    description: 'Check monthly; high humidity often means the A/C runs more, clogging filters faster.',
    season: 'summer',
    activeMonths: [5, 6, 7],
    notifyMonths: notifyBefore([5]),
    category: 'HVAC',
  },

  // ── Fall (September–November) ──
  {
    id: 'hvac-furnace',
    name: 'Furnace Inspection',
    description: 'Schedule a professional furnace inspection.',
    season: 'fall',
    activeMonths: [8, 9, 10],
    notifyMonths: notifyBefore([8, 9]),
    category: 'HVAC',
  },
  {
    id: 'irrigation-winterize',
    name: 'Irrigation Winterization',
    description: 'Blow out and winterize lines before the first hard freeze (usually by early November).',
    season: 'fall',
    activeMonths: [9, 10],
    notifyMonths: notifyBefore([9, 10]),
    category: 'Irrigation',
  },
  {
    id: 'pool-close',
    name: 'Pool Closing & Winterization',
    description: 'Close and winterize the pool; install the safety cover.',
    season: 'fall',
    activeMonths: [8, 9],
    notifyMonths: notifyBefore([8, 9]),
    category: 'Pool',
  },
  {
    id: 'gutters-fall',
    name: 'Fall Gutter Cleaning',
    description: 'Clean again after the leaves have fallen to prevent winter ice dams.',
    season: 'fall',
    activeMonths: [9, 10],
    notifyMonths: notifyBefore([9, 10]),
    category: 'Gutters',
  },
  {
    id: 'outdoor-faucets',
    name: 'Outdoor Faucet Winterization',
    description: 'Disconnect hoses and shut off interior valves to prevent burst pipes.',
    season: 'fall',
    activeMonths: [9, 10],
    notifyMonths: notifyBefore([9, 10]),
    category: 'Plumbing',
  },
  {
    id: 'fireplace-chimney',
    name: 'Chimney Sweep & Inspection',
    description: 'Have the chimney swept and inspected before the first fire.',
    season: 'fall',
    activeMonths: [8, 9, 10],
    notifyMonths: notifyBefore([8, 9]),
    category: 'Fireplace',
  },
  {
    id: 'aeration-overseeding',
    name: 'Lawn Aeration & Overseeding',
    description: 'Aerate and overseed the lawn (the best time for Indiana turf).',
    season: 'fall',
    activeMonths: [8, 9],
    notifyMonths: notifyBefore([8, 9]),
    category: 'Lawn',
  },

  // ── Winter (December–February) ──
  {
    id: 'foundation-check',
    name: 'Foundation Inspection',
    description: 'Check for cracks and ensure snow isn\'t piling up directly against the siding.',
    season: 'winter',
    activeMonths: [11, 0, 1],
    notifyMonths: notifyBefore([11, 0]),
    category: 'Foundation',
  },
  {
    id: 'humidifier',
    name: 'Furnace Humidifier Maintenance',
    description: 'Clean the furnace humidifier and replace the water panel.',
    season: 'winter',
    activeMonths: [11, 0, 1],
    notifyMonths: notifyBefore([11, 0]),
    category: 'HVAC',
  },
  {
    id: 'alarms-test',
    name: 'Smoke & CO Detector Test',
    description: 'Test smoke and carbon monoxide detectors.',
    season: 'winter',
    activeMonths: [11, 0, 1],
    notifyMonths: notifyBefore([11, 0]),
    category: 'Safety',
  },
  {
    id: 'attic-inspection',
    name: 'Attic Condensation Check',
    description: 'Check for signs of condensation or frost buildup on the underside of the roof.',
    season: 'winter',
    activeMonths: [11, 0, 1],
    notifyMonths: notifyBefore([11, 0]),
    category: 'Attic',
  },

  // ── Recurring / Ongoing ──
  {
    id: 'hvac-filters-monthly',
    name: 'HVAC Air Filter Replacement',
    description: 'Replace HVAC air filters.',
    season: 'recurring',
    frequency: 'Monthly',
    activeMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    notifyMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    category: 'HVAC',
  },
  {
    id: 'range-hood-disposal',
    name: 'Range Hood & Disposal Cleaning',
    description: 'Clean range hood filters and garbage disposal.',
    season: 'recurring',
    frequency: 'Monthly',
    activeMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    notifyMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    category: 'Kitchen',
  },
  {
    id: 'sump-pump-biannual',
    name: 'Sump Pump & Water Backup Test',
    description: 'Test sump pump and water backup system.',
    season: 'recurring',
    frequency: 'Every 6 Months',
    activeMonths: [2, 8], // March, September
    notifyMonths: notifyBefore([2, 8]),
    category: 'Sump Pump',
  },
  {
    id: 'dryer-vent-clean',
    name: 'Dryer Vent Deep Clean',
    description: 'Deep clean the dryer vent (prevents fires).',
    season: 'recurring',
    frequency: 'Every 12 Months',
    activeMonths: [0], // January
    notifyMonths: [11], // Notify in December
    category: 'Appliances',
  },
  {
    id: 'water-heater-flush',
    name: 'Water Heater Flush',
    description: 'Flush the water heater to remove sediment (Indiana has notoriously hard water).',
    season: 'recurring',
    frequency: 'Annually',
    activeMonths: [0], // January
    notifyMonths: [11],
    category: 'Plumbing',
  },
  {
    id: 'water-softener-check',
    name: 'Water Softener Check',
    description: 'Check the salt level and performance of your water softener.',
    season: 'recurring',
    frequency: 'Monthly',
    activeMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    notifyMonths: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    category: 'Plumbing',
  },
  {
    id: 'septic-pump',
    name: 'Septic Tank Pumping',
    description: 'Pump the septic tank (if applicable).',
    season: 'recurring',
    frequency: 'Every 2-3 Years',
    activeMonths: [5], // June
    notifyMonths: [4],
    category: 'Plumbing',
  },
  {
    id: 'radon-inspection',
    name: 'Radon System Inspection',
    description: 'Inspect radon system (if applicable).',
    season: 'recurring',
    frequency: 'Every 2-3 Years',
    activeMonths: [0], // January
    notifyMonths: [11],
    category: 'Safety',
  },
];

export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

export function getSeasonLabel(season: Season): string {
  const labels: Record<Season, string> = {
    spring: 'Spring (March – May)',
    summer: 'Summer (June – August)',
    fall: 'Fall (September – November)',
    winter: 'Winter (December – February)',
  };
  return labels[season];
}

export function getSeasonColor(season: Season | 'recurring'): string {
  const colors: Record<string, string> = {
    spring: 'bg-green-100 text-green-800',
    summer: 'bg-yellow-100 text-yellow-800',
    fall: 'bg-orange-100 text-orange-800',
    winter: 'bg-blue-100 text-blue-800',
    recurring: 'bg-purple-100 text-purple-800',
  };
  return colors[season] || 'bg-gray-100 text-gray-800';
}

/**
 * Get items that should be recommended this month for a client,
 * based on their selected services and the current month.
 * Uses notifyMonths to give 30-day advance notice.
 */
export function getRecommendedItems(
  clientServiceIds: string[],
  currentMonth?: number
): MaintenanceItem[] {
  const month = currentMonth ?? new Date().getMonth();
  return MAINTENANCE_ITEMS.filter(
    (item) =>
      clientServiceIds.includes(item.id) &&
      (item.notifyMonths.includes(month) || item.activeMonths.includes(month))
  );
}
