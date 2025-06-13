# Service Fusion API Integration

This directory contains the client and related logic for integrating with the Service Fusion API.

## Purpose

The primary purpose of this integration is to connect the Dr. Handyman application with Service Fusion to manage jobs, customers, estimates, invoices, and calendar tasks directly from the admin dashboard.

## Client (`client.ts`)

The `client.ts` file provides a pre-configured `axios` instance for making requests to the Service Fusion API.

### Authentication

The client automatically handles authentication using the OAuth 2.0 Client Credentials grant type. It fetches and refreshes a bearer token and includes it in the `Authorization` header of all subsequent requests.

### Environment Variables

To use this client, you must set the following environment variables in your `.env.local` or `.env` file:

```
SERVICE_FUSION_CLIENT_ID="your_client_id_here"
SERVICE_FUSION_CLIENT_SECRET="your_client_secret_here"
```

These credentials must be obtained from your Service Fusion Pro plan account.

### Usage

You can import the client methods directly to interact with the API.

```typescript
import { getCustomers, createJob } from '@/lib/service-fusion/client';

// Fetch a list of customers
const customers = await getCustomers();

// Create a new job
const newJob = await createJob({
  customer_id: 123,
  description: 'New job from app'
});
```

### Available Methods

The client supports full CRUD (Create, Read, Update, Delete) operations for major resources and read-only access for supporting resources.

**Customers:**
*   `getCustomers(params)`
*   `createCustomer(data)`
*   `updateCustomer(id, data)`
*   `deleteCustomer(id)`

**Jobs:**
*   `getJobs(params)`
*   `createJob(data)`
*   `updateJob(id, data)`
*   `deleteJob(id)`
*   `convertJobToInvoice(id)`

**Estimates:**
*   `getEstimates(params)`
*   `createEstimate(data)`
*   `updateEstimate(id, data)`
*   `deleteEstimate(id)`
*   `convertEstimateToJob(id)`

**Invoices:**
*   `getInvoices(params)`
*   `createInvoice(data)`
*   `updateInvoice(id, data)`
*   `deleteInvoice(id)`

**Calendar Tasks:**
*   `getCalendarTasks(params)`
*   `createCalendarTask(data)`
*   `updateCalendarTask(id, data)`
*   `deleteCalendarTask(id)`

**Read-Only & Utility:**
*   `getJobCategories(params)`
*   `getJobStatuses(params)`
*   `getPaymentTypes(params)`
*   `getSources(params)`
*   `getTechs(params)`
*   `getMe()`

## UI Components

The UI components for this integration are located in `/ts-pnpm/src/app/admin/service-fusion/`.

*   **/**: The main dashboard, which displays authenticated user info from the `/me` endpoint.
*   **/customers**: Manage Service Fusion customers.
*   **/jobs**: Manage Service Fusion jobs.
*   **/estimates**: Manage Service Fusion estimates.
*   **/invoices**: Manage Service Fusion invoices.
*   **/calendar-tasks**: Manage calendar tasks.
*   **/read-only**: A tabbed view for read-only resources like Job Categories, Statuses, Payment Types, etc.


## Known Limitations

*   **Placeholder URLs**: The `BASE_URL` and token endpoint URL in the client are based on standard conventions but should be verified against the official documentation provided by Service Fusion for your specific account.
*   **API Rate Limits**: The client does not currently implement any specific rate-limiting logic. Heavy usage may lead to API errors.

--- 