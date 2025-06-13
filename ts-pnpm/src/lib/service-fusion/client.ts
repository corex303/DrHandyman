/**
 * Service Fusion API Client
 *
 * This module provides a client for interacting with the Service Fusion API.
 * It handles authentication (OAuth 2.0 Client Credentials Grant) and provides
 * methods for interacting with various API endpoints.
 *
 * @module lib/service-fusion/client
 */
import axios, { AxiosRequestConfig } from 'axios';
import { 
  CustomerBody, 
  CustomerView,
  JobBody,
  JobView,
  EstimateBody,
  EstimateView,
  InvoiceView,
  JobCategory,
  JobStatus,
  Me,
  PaymentType,
  Source,
  Tech,
  CalendarTask,
  InvoiceBody,
  CalendarTaskBody
} from 'service-fusion';

const BASE_URL = 'https://api.servicefusion.com/v1';
const TOKEN_URL = 'https://api.servicefusion.com/oauth/access_token';

interface IToken {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

// In-memory token storage. For multi-instance deployments, a shared store like Redis is recommended.
const tokenStore: IToken = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

/**
 * Retrieves an OAuth 2.0 access token from the Service Fusion API.
 * Uses the Client Credentials grant type. The client ID and secret must be
 * set as environment variables. It handles token caching and refreshing.
 *
 * @returns {Promise<string>} A promise that resolves to the access token.
 */
const getAccessToken = async (): Promise<string> => {
  const now = Date.now();

  // If token exists and is not expired (with a 60-second buffer), return it.
  if (tokenStore.accessToken && tokenStore.expiresAt && tokenStore.expiresAt > now + 60000) {
    return tokenStore.accessToken;
  }

  const clientId = process.env.SERVICE_FUSION_CLIENT_ID;
  const clientSecret = process.env.SERVICE_FUSION_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Service Fusion API credentials are not set in environment variables.');
  }

  try {
    let response;
    // If we have a refresh token, use it.
    if (tokenStore.refreshToken) {
      response = await axios.post(TOKEN_URL, {
        grant_type: 'refresh_token',
        refresh_token: tokenStore.refreshToken,
      });
    } else {
      // Otherwise, perform a full client credentials grant.
      response = await axios.post(TOKEN_URL, {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });
    }

    const { access_token, refresh_token, expires_in } = response.data;

    tokenStore.accessToken = access_token;
    tokenStore.refreshToken = refresh_token;
    // expires_in is in seconds, convert to milliseconds for expiresAt
    tokenStore.expiresAt = Date.now() + (expires_in * 1000);

    if (!tokenStore.accessToken) {
      throw new Error('Failed to retrieve access token from Service Fusion.');
    }

    return tokenStore.accessToken;
  } catch (error) {
    // Clear potentially invalid refresh token on error
    tokenStore.refreshToken = null; 
    console.error('Failed to get or refresh Service Fusion access token:', error);
    throw new Error('Could not retrieve access token from Service Fusion.');
  }
};

/**
 * An axios client instance pre-configured for the Service Fusion API.
 * It includes an interceptor that automatically adds the bearer token to the
 * Authorization header of every request sent using this client instance.
 */
const serviceFusionClient = axios.create({
  baseURL: BASE_URL,
});

serviceFusionClient.interceptors.request.use(async (config: AxiosRequestConfig) => {
  const token = await getAccessToken();
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as any,
  };
}, (error: any) => {
  return Promise.reject(error);
});

// =================================================================================
// API Methods
// =================================================================================

// Note: We are replacing the previous placeholder functions with fully typed methods.
// The schemas for request bodies and response types should be imported from a 
// types file, which we will create based on the `service-fusion-types.mdc` rule.

// For now, we will use `any` as a placeholder for the types.

/**
 * Retrieves a list of customers.
 * @param {any} params - Filtering, pagination, and sorting parameters.
 * @returns {Promise<CustomerView[]>} A promise that resolves to the list of customers.
 */
export const getCustomers = async (params?: any): Promise<CustomerView[]> => {
  const response = await serviceFusionClient.get('/customers', { params });
  return response.data.items;
};

/**
 * Creates a new customer.
 * @param {CustomerBody} data - The customer data.
 * @returns {Promise<CustomerView>} A promise that resolves to the created customer.
 */
export const createCustomer = async (data: CustomerBody): Promise<CustomerView> => {
  const response = await serviceFusionClient.post('/customers', data);
  return response.data;
};

/**
 * Updates an existing customer.
 * @param {number} id - The ID of the customer to update.
 * @param {CustomerBody} data - The customer data to update.
 * @returns {Promise<CustomerView>} A promise that resolves to the updated customer.
 */
export const updateCustomer = async (id: number, data: CustomerBody): Promise<CustomerView> => {
    const response = await serviceFusionClient.put(`/customers/${id}`, data);
    return response.data;
};

/**
 * Deletes a customer.
 * @param {number} id - The ID of the customer to delete.
 * @returns {Promise<void>} A promise that resolves when the customer is deleted.
 */
export const deleteCustomer = async (id: number): Promise<void> => {
    await serviceFusionClient.delete(`/customers/${id}`);
};

/**
 * Retrieves a list of jobs.
 * @param {any} params - Filtering, pagination, and sorting parameters.
 * @returns {Promise<JobView[]>} A promise that resolves to the list of jobs.
 */
export const getJobs = async (params?: any): Promise<JobView[]> => {
  const finalParams = { expand: 'customer', ...params };
  const response = await serviceFusionClient.get('/jobs', { params: finalParams });
  return response.data.items;
};

/**
 * Creates a new job.
 * @param {JobBody} data - The job data.
 * @returns {Promise<JobView>} A promise that resolves to the created job.
 */
export const createJob = async (data: JobBody): Promise<JobView> => {
  const response = await serviceFusionClient.post('/jobs', data);
  return response.data;
};

/**
 * Updates an existing job.
 * @param {number} id - The ID of the job to update.
 * @param {JobBody} data - The job data to update.
 * @returns {Promise<JobView>} A promise that resolves to the updated job.
 */
export const updateJob = async (id: number, data: JobBody): Promise<JobView> => {
    const response = await serviceFusionClient.put(`/jobs/${id}`, data);
    return response.data;
};

/**
 * Deletes a job.
 * @param {number} id - The ID of the job to delete.
 * @returns {Promise<void>} A promise that resolves when the job is deleted.
 */
export const deleteJob = async (id: number): Promise<void> => {
    await serviceFusionClient.delete(`/jobs/${id}`);
};

/**
 * Converts a job to an invoice.
 * @param {number} id - The ID of the job to convert.
 * @returns {Promise<InvoiceView>} A promise that resolves to the newly created invoice.
 */
export const convertJobToInvoice = async (id: number): Promise<InvoiceView> => {
    const response = await serviceFusionClient.post(`/jobs/${id}/convert-to-invoice`);
    return response.data;
};

/**
 * Retrieves a list of estimates.
 * @param {any} params - Filtering, pagination, and sorting parameters.
 * @returns {Promise<EstimateView[]>} A promise that resolves to the list of estimates.
 */
export const getEstimates = async (params?: any): Promise<EstimateView[]> => {
  const finalParams = { expand: 'customer', ...params };
  const response = await serviceFusionClient.get('/estimates', { params: finalParams });
  return response.data.items;
};

/**
 * Creates a new estimate.
 * @param {EstimateBody} data - The estimate data.
 * @returns {Promise<EstimateView>} A promise that resolves to the created estimate.
 */
export const createEstimate = async (data: EstimateBody): Promise<EstimateView> => {
  const response = await serviceFusionClient.post('/estimates', data);
  return response.data;
};

/**
 * Updates an existing estimate.
 * @param {number} id - The ID of the estimate to update.
 * @param {EstimateBody} data - The estimate data to update.
 * @returns {Promise<EstimateView>} A promise that resolves to the updated estimate.
 */
export const updateEstimate = async (id: number, data: EstimateBody): Promise<EstimateView> => {
    const response = await serviceFusionClient.put(`/estimates/${id}`, data);
    return response.data;
};

/**
 * Deletes an estimate.
 * @param {number} id - The ID of the estimate to delete.
 * @returns {Promise<void>} A promise that resolves when the estimate is deleted.
 */
export const deleteEstimate = async (id: number): Promise<void> => {
    await serviceFusionClient.delete(`/estimates/${id}`);
};

/**
 * Converts an estimate to a job.
 * @param {number} id - The ID of the estimate to convert.
 * @returns {Promise<JobView>} A promise that resolves to the newly created job.
 */
export const convertEstimateToJob = async (id: number): Promise<JobView> => {
    const response = await serviceFusionClient.post(`/estimates/${id}/convert-to-job`);
    return response.data;
};

// Placeholder for other resource methods. Will be implemented fully.
export const getInvoices = async (params?: any): Promise<InvoiceView[]> => {
  const finalParams = { expand: 'customer', ...params };
  const response = await serviceFusionClient.get('/invoices', { params: finalParams });
  return response.data.items;
};

/**
 * Creates a new invoice.
 * @param {InvoiceBody} data - The invoice data.
 * @returns {Promise<InvoiceView>} A promise that resolves to the created invoice.
 */
export const createInvoice = async (data: InvoiceBody): Promise<InvoiceView> => {
  const response = await serviceFusionClient.post('/invoices', data);
  return response.data;
};

/**
 * Updates an existing invoice.
 * @param {number} id - The ID of the invoice to update.
 * @param {InvoiceBody} data - The invoice data to update.
 * @returns {Promise<InvoiceView>} A promise that resolves to the updated invoice.
 */
export const updateInvoice = async (id: number, data: InvoiceBody): Promise<InvoiceView> => {
    const response = await serviceFusionClient.put(`/invoices/${id}`, data);
    return response.data;
};

/**
 * Deletes an invoice.
 * @param {number} id - The ID of the invoice to delete.
 * @returns {Promise<void>} A promise that resolves when the invoice is deleted.
 */
export const deleteInvoice = async (id: number): Promise<void> => {
    await serviceFusionClient.delete(`/invoices/${id}`);
};

export const getJobCategories = async (params?: any): Promise<JobCategory[]> => {
  const response = await serviceFusionClient.get('/job-categories', { params });
  return response.data.items;
};

export const getJobStatuses = async (params?: any): Promise<JobStatus[]> => {
  const response = await serviceFusionClient.get('/job-statuses', { params });
  return response.data.items;
};

export const getMe = async (): Promise<Me> => {
  const response = await serviceFusionClient.get('/me');
  return response.data;
};

export const getPaymentTypes = async (params?: any): Promise<PaymentType[]> => {
  const response = await serviceFusionClient.get('/payment-types', { params });
  return response.data.items;
};

export const getSources = async (params?: any): Promise<Source[]> => {
  const response = await serviceFusionClient.get('/sources', { params });
  return response.data.items;
};

export const getTechs = async (params?: any): Promise<Tech[]> => {
  const response = await serviceFusionClient.get('/techs', { params });
  return response.data.items;
};

export const getCalendarTasks = async (params?: any): Promise<CalendarTask[]> => {
    const response = await serviceFusionClient.get('/calendar-tasks', { params });
    return response.data.items;
};

/**
 * Creates a new calendar task.
 * @param {CalendarTaskBody} data - The calendar task data.
 * @returns {Promise<CalendarTask>} A promise that resolves to the created calendar task.
 */
export const createCalendarTask = async (data: CalendarTaskBody): Promise<CalendarTask> => {
  const response = await serviceFusionClient.post('/calendar-tasks', data);
  return response.data;
};

/**
 * Updates an existing calendar task.
 * @param {number} id - The ID of the calendar task to update.
 * @param {CalendarTaskBody} data - The calendar task data to update.
 * @returns {Promise<CalendarTask>} A promise that resolves to the updated calendar task.
 */
export const updateCalendarTask = async (id: number, data: CalendarTaskBody): Promise<CalendarTask> => {
    const response = await serviceFusionClient.put(`/calendar-tasks/${id}`, data);
    return response.data;
};

/**
 * Deletes a calendar task.
 * @param {number} id - The ID of the calendar task to delete.
 * @returns {Promise<void>} A promise that resolves when the calendar task is deleted.
 */
export const deleteCalendarTask = async (id: number): Promise<void> => {
    await serviceFusionClient.delete(`/calendar-tasks/${id}`);
};

export default serviceFusionClient; 