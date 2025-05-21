---
description: 
globs: 
alwaysApply: false
---
# Key Features & User Roles: Dr. Handyman NC Website

The website serves distinct user groups with specific functionalities.

## Target Audience & Roles:
1.  **Prospective Customers:** View services, portfolio, contact, request quotes.
2.  **Existing Customers:** Make payments, re-engage for new services.
3.  **Maintenance Workers:** Log in to a portal to upload before & after job photos (categorized by service, with descriptions) for admin approval.
4.  **Site Administrator:** Manage all website content via an admin panel (services, portfolio, testimonials, worker accounts, inquiries, site settings).

## Key Functional Areas:

### Public-Facing Website:
- Homepage, Services (overview & individual pages with galleries), About Us, Contact (form handled by React Hook Form, Zod, and Next.js API routes), Testimonials, FAQ, Secure Payment Page (Stripe integration).

### Worker Portal:
- Secure authentication (NextAuth.js).
- Dashboard to manage photo uploads.
- Photo upload functionality (before/after images, service category selection, descriptions). Uploads require admin approval.

### Admin Panel (CMS):
- Secure authentication (NextAuth.js).
- Dashboard for site overview.
- Management of: Services, Portfolio (approve/edit/reject worker uploads, direct admin uploads), Page Content (About Us, FAQ), Testimonials, Worker Accounts, Inquiries (view data captured from contact form via Next.js API routes), Basic Site Settings & SEO.

Refer to section e "Features and requirements" and section f "User stories and acceptance criteria" in the [Dr. Handyman PRD.md](mdc:ts-pnpm/scripts/Dr. Handyman PRD.md) for complete details.

