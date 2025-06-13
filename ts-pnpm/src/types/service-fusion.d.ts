/**
 * This file contains TypeScript definitions for the data structures
 * used by the Service Fusion API. These types are based on the official
 * API documentation.
 *
 * @see https://docs.servicefusion.com/
 */

declare module 'service-fusion' {

  // =================================================================================
  // Generic & Utility Types
  // =================================================================================

  export interface CustomField {
    name: string;
    value: any;
    type: string;
    group: string;
    created_at: string; // datetime
    updated_at: string; // datetime
    is_required: boolean;
  }

  export interface CustomFieldBody {
    name: string;
    value: any;
  }

  // =================================================================================
  // Customer Resource Types
  // =================================================================================

  export interface CustomerPhone {
    id: number;
    phone: string;
    ext: number | null;
    type: 'Mobile' | 'Home' | 'Work' | 'Other';
    created_at: string; // datetime
    updated_at: string; // datetime
    is_mobile: boolean;
  }

  export interface CustomerPhoneBody {
    phone: string;
    ext?: number;
    type?: 'Mobile' | 'Home' | 'Work' | 'Other';
  }
  
  export interface CustomerEmail {
    id: number;
    email: string;
    class: 'Personal' | 'Business' | 'Other';
    types_accepted: string; // "CONF,STATUS,PMT,INV"
    created_at: string; // datetime
    updated_at: string; // datetime
  }

  export interface CustomerEmailBody {
    email: string;
    class?: 'Personal' | 'Business' | 'Other';
    types_accepted?: string;
  }

  export interface CustomerContact {
    id: number;
    prefix: string | null;
    fname: string;
    lname: string;
    suffix: string | null;
    contact_type: string | null;
    dob: string | null; // date
    anniversary: string | null; // date
    job_title: string | null;
    department: string | null;
    created_at: string; // datetime
    updated_at: string; // datetime
    is_primary: boolean;
    phones: CustomerPhone[];
    emails: CustomerEmail[];
  }

  export interface CustomerContactBody {
    prefix?: string;
    fname: string;
    lname: string;
    suffix?: string;
    contact_type?: string;
    dob?: string;
    anniversary?: string;
    job_title?: string;
    department?: string;
    is_primary?: boolean;
    phones?: CustomerPhoneBody[];
    emails?: CustomerEmailBody[];
  }

  export interface CustomerLocation {
    id: number;
    street_1: string;
    street_2: string | null;
    city: string;
    state_prov: string;
    postal_code: string;
    country: string;
    nickname: string | null;
    gate_instructions: string | null;
    latitude: number;
    longitude: number;
    location_type: string | null;
    created_at: string; // datetime
    updated_at: string; // datetime
    is_primary: boolean;
    is_gated: boolean;
    is_bill_to: boolean;
    customer_contact: string | null; // Header string
  }

  export interface CustomerLocationBody {
    street_1: string;
    street_2?: string;
    city?: string;
    state_prov?: string;
    postal_code?: string;
    country?: string;
    nickname?: string;
    gate_instructions?: string;
    latitude?: number;
    longitude?: number;
    location_type?: string;
    is_primary?: boolean;
    is_gated?: boolean;
    is_bill_to?: boolean;
    customer_contact?: string; // ID or header
  }

  export interface CustomerView {
    id: number;
    customer_name: string;
    fully_qualified_name: string;
    parent_customer: string | null;
    account_number: string;
    account_balance: number;
    private_notes: string | null;
    public_notes: string | null;
    credit_rating: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'U' | null;
    labor_charge_type: 'flat' | 'hourly' | null;
    labor_charge_default_rate: number;
    last_serviced_date: string | null; // datetime
    is_bill_for_drive_time: boolean;
    is_vip: boolean;
    referral_source: string | null;
    agent: string | null;
    discount: number;
    discount_type: '$' | '%';
    payment_type: string | null;
    payment_terms: string | null;
    assigned_contract: string | null;
    industry: string | null;
    is_taxable: boolean;
    tax_item_name: string | null;
    qbo_sync_token: number | null;
    qbo_currency: 'USD' | 'CAD' | 'JMD' | 'THB';
    qbo_id: number | null;
    qbd_id: string | null;
    created_at: string; // datetime
    updated_at: string; // datetime
    contacts: CustomerContact[];
    locations: CustomerLocation[];
    custom_fields: CustomField[];
    _expandable: string[];
  }

  export interface CustomerBody {
    customer_name: string;
    parent_customer?: string; // ID or header
    account_number?: string;
    private_notes?: string;
    public_notes?: string;
    credit_rating?: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'U';
    labor_charge_type?: 'flat' | 'hourly';
    labor_charge_default_rate?: number;
    last_serviced_date?: string; // datetime
    is_bill_for_drive_time?: boolean;
    is_vip?: boolean;
    referral_source?: string; // ID or header
    agent?: string; // ID or header
    discount?: number;
    discount_type?: '$' | '%';
    payment_type?: string; // ID or header
    payment_terms?: string;
    assigned_contract?: string; // ID or header
    industry?: string; // ID or header
    is_taxable?: boolean;
    tax_item_name?: string; // ID or header
    qbo_sync_token?: number;
    qbo_currency?: 'USD' | 'CAD' | 'JMD' | 'THB';
    contacts?: CustomerContactBody[];
    locations?: CustomerLocationBody[];
    custom_fields?: CustomFieldBody[];
  }

  // =================================================================================
  // Job Resource Types
  // =================================================================================

  export interface JobView {
    id: number;
    job_number: string;
    description: string | null;
    status_name: string;
    category_name: string | null;
    priority: number;
    source_name: string | null;
    po_number: string | null;
    customer_notes: string | null;
    created_at: string; // datetime
    updated_at: string; // datetime
    customer_id: number;
    customer_name: string;
    customer?: Partial<CustomerView>;
    // ... other job fields based on docs
  }

  export interface JobBody {
    customer_id: number;
    description?: string;
    category_id?: number;
    priority?: number;
    source_id?: number;
    po_number?: string;
    customer_notes?: string;
    // ... other job body fields
  }

  // =================================================================================
  // Estimate Resource Types
  // =================================================================================

  export interface EstimateView {
    id: number;
    estimate_number: string;
    description: string | null;
    status: string; // e.g., 'Draft', 'Sent', 'Accepted', 'Rejected'
    created_at: string; // datetime
    updated_at: string; // datetime
    customer_id: number;
    customer_name: string;
    customer?: Partial<CustomerView>;
    // ... other estimate fields
  }

  export interface EstimateBody {
    customer_id: number;
    description?: string;
    // ... other estimate body fields
  }

  // =================================================================================
  // Invoice Resource Types
  // =================================================================================

  export interface InvoiceView {
    id: number;
    invoice_number: string;
    status: string; // e.g., 'Draft', 'Sent', 'Paid', 'Void'
    balance: number;
    total: number;
    created_at: string; // datetime
    updated_at: string; // datetime
    customer_id: number;
    customer_name: string;
    customer?: Partial<CustomerView>;
    // ... other invoice fields
  }
  
  // Note: Invoices are typically created from jobs, so a direct create body may not exist.
  // We will define a placeholder for now.
  export interface InvoiceBody {
    customer_id: number;
    job_id?: number; // Can be created from a job or directly
    // ... other invoice body fields
  }

  // =================================================================================
  // Read-Only & Other Resource Types
  // =================================================================================

  export interface JobCategory {
    id: number;
    name: string;
  }

  export interface JobStatus {
    id: number;
    name: string;
    is_default: boolean;
  }

  export interface Me {
    id: number;
    email: string;
    fname: string;
    lname: string;
    // ... other 'me' fields
  }

  export interface PaymentType {
    id: number;
    name: string;
  }

  export interface Source {
    id: number;
    name: string;
  }

  export interface Tech {
    id: number;
    name: string;
    // ... other tech fields
  }

  export interface CalendarTask {
    id: number;
    title: string;
    description?: string;
    start_time?: string; // datetime
    end_time?: string; // datetime
    is_all_day?: boolean;
    // ... other calendar task fields based on actual API response
  }

  export interface CalendarTaskBody {
    title: string;
    description?: string;
    start_time?: string; // datetime
    end_time?: string; // datetime
    is_all_day?: boolean;
    // You would add fields for assignees and recurrence here
    // e.g., tech_ids: number[];
  }

  // TODO: Add types for all other resources (Invoices, etc.)
} 