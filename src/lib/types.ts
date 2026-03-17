export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  services: string[];
  created_at: string;
  updated_at: string;
}

export interface Communication {
  id: string;
  client_id: string;
  note: string;
  communicated_at: string;
  created_at: string;
}

export interface ClientWithLastContact extends Client {
  last_contact: string | null;
  contacted_this_month: boolean;
}
