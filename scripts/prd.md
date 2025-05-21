# Product Requirements Document: Dr. Handyman NC Website Revamp

**Version:** 1.0
**Date:** 5/15/25
**Author:** Cory You
**Project:** Dr. Handyman Website Revamp

## a. Introduction

This document outlines the requirements for the redesign and redevelopment of the Dr. Handyman NC website (drhandymannc.com). The primary purpose of this PRD is to serve as a central guide for the project team, detailing the scope, features, and technical specifications for the new website. The project involves replacing the current WordPress site with a custom-built Next.js application. The aim is to create an industry-leading small business website that is professional, trustworthy, fast, and user-friendly, serving as a primary marketing and operational tool for Dr. Handyman NC.

## b. Product overview

The Dr. Handyman NC website revamp project aims to deliver a modern, high-performance web application built with Next.js. This new platform will replace the existing WordPress site, offering an enhanced user experience and expanded functionality. Key aspects of the product include:

*   **Marketing and Lead Generation:** The site will effectively showcase Dr. Handyman's services and completed projects to attract potential customers and facilitate service inquiries.
*   **Portfolio Management:** Dynamic portfolio sections within each service page will display before & after photos of completed work, specific to that service category. Maintenance workers will have the capability to contribute to this portfolio.
*   **Customer Interaction:** The site will enable customers to easily contact Dr. Handyman, request quotes, and make online payments.
*   **Content Management:** A robust admin panel will allow for easy management of site content, including services, portfolio images, testimonials, and worker accounts.
*   **Technology:** The site will leverage Next.js for optimal performance, SEO, and a modern development experience.

The ultimate goal is to provide Dr. Handyman NC with a digital presence that reflects their professionalism, enhances customer engagement, and streamlines business operations.

## c. Goals and objectives

The primary goals and objectives for the Dr. Handyman NC website revamp are:

*   **Enhance brand image:** Project a modern, professional, and reliable image for Dr. Handyman NC.
*   **Improve user experience (UX):** Provide a fast, intuitive, and mobile-responsive experience for all users, ensuring high accessibility.
*   **Increase lead generation:** Streamline the inquiry process and make it easy for potential customers to request services, with a target of increasing qualified leads by X% within 6 months.
*   **Showcase expertise:** Effectively display high-quality before & after photos of completed work across various service categories.
*   **Streamline content management:** Enable easy updates for services, portfolio images (by admin and workers), and other site content through a user-friendly admin panel.
*   **Facilitate payments:** Offer a secure and convenient way for customers to pay for services online.
*   **Improve SEO:** Leverage Next.js capabilities and best practices for better search engine visibility and higher ranking for target keywords.
*   **Increase operational efficiency:** Allow maintenance workers to directly contribute to the portfolio, reducing administrative overhead.
*   **Improve site performance:** Achieve a Google PageSpeed Insights score of 80+ for both mobile and desktop.

## d. Target audience

The website will cater to the following distinct user groups:

*   **Prospective customers:** Homeowners and residential property managers within Dr. Handyman NC's service area who are seeking reliable, professional handyman services. They are looking for information, examples of work, and an easy way to request a quote.
*   **Existing customers:** Individuals who have previously used Dr. Handyman NC's services and may be returning for new services or to make payments for completed work.
*   **Maintenance workers/Technicians:** Employees or contractors of Dr. Handyman NC who need a secure and straightforward way to upload before & after photos of their completed jobs, categorized by service.
*   **Site administrator (Dr. Handyman or delegate):** The individual(s) responsible for managing all aspects of the website content, including services, portfolio, testimonials, worker accounts, inquiries, and basic site settings.

## e. Features and requirements

### e.1 Functional requirements

#### e.1.1 Public-facing website

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| FR-PF-01 | Homepage | - Compelling hero section with a clear value proposition and CTA. <br> - Overview of key services with links to detailed pages. <br> - Featured portfolio/gallery highlights. <br> - Customer testimonials. <br> - Clear and intuitive navigation. | High |
| FR-PF-02 | Services pages | - A main services overview page. <br> - Individual, detailed pages for each core service category (Carpentry, Concrete, Concrete Repair, Deck Building / Repair, Demolition, Flooring Installation, Garage Door / Opener Installation, Garbage Disposal Installation/Repair, Gutter Cleaning, Hot Water Tank Installation, Interior / Exterior Door Installation, Interior / Exterior Painting or Staining, Insulation Installation, Masonry, Plumbing repairs, Property Cleanup, Remodeling Work, Roofing, Screen Door Installation, Site Preparation, Sump Pump Installation, Trenching / Excavation, General Handyman Services). <br> - Comprehensive descriptions of what each service entails. <br> - Comprehensive before & after gallery integrated into each service page, showcasing work specific to that service. <br> - Clear CTAs to request a quote or view related portfolio items. | High |
| FR-PF-03 | About Us page | - Company story, mission, and values. <br> - Information about Dr. Handyman (the person/team). <br> - Prominent display of licenses, insurance, and guarantees (trust signals). | High |
| FR-PF-04 | Contact page | - User-friendly contact form built with React Hook Form and Zod for validation, submitted to a Next.js API route. <br> - Clearly displayed phone number, email address, and service area information (map optional). <br> - Links to social media profiles (if applicable). | High |
| FR-PF-05 | Testimonials page | - A dedicated page to showcase a collection of customer reviews and testimonials. | High |
| FR-PF-06 | FAQ page | - A section answering common customer questions. | Medium |
| FR-PF-07 | Payment page/Portal | - Secure interface for customers to make online payments. <br> - Integration with a third-party payment provider (e.g., Stripe, PayPal). <br> - Ability for customers to input an invoice number and amount, or select pre-defined service packages if applicable in the future. | High |
| FR-PF-08 | Blog (Optional) | - Basic blog functionality for publishing articles, tips, and company news (for future SEO growth). | Low |

#### e.1.2 Worker portal

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| FR-WP-01 | Worker authentication | - Secure login and logout mechanism for maintenance workers. | High |
| FR-WP-02 | Worker dashboard | - A simple, intuitive interface for workers to manage their photo uploads. <br> - Display status of uploaded photos (e.g., pending approval, approved). | High |
| FR-WP-03 | Photo upload functionality | - Ability to upload "before" and "after" images for a single job. <br> - A dropdown menu to select the relevant service category for the job. <br> - A text field for adding a brief description or notes about the job. <br> - Uploaded photos are submitted for admin approval before appearing on the public site. | High |

#### e.1.3 Admin panel (CMS functionality)

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| FR-AP-01 | Admin authentication | - Secure login and logout mechanism for site administrators. | High |
| FR-AP-02 | Admin dashboard | - An overview of recent site activity, such as new inquiries (processed via Next.js API routes), and portfolio items pending approval. | High |
| FR-AP-03 | Services management | - Add, edit, and delete service categories and their detailed descriptions, including associated images. | High |
| FR-AP-04 | Portfolio management | - Approve, edit, or reject photos uploaded by workers. <br> - Ability for admin to upload photos directly. <br> - Organize photos into service categories. <br> - Edit image titles/descriptions. | High |
| FR-AP-05 | Page content management | - Edit content for static pages like "About Us", "FAQ", etc. | High |
| FR-AP-06 | Testimonials management | - Add, edit, approve, and delete customer testimonials. | High |
| FR-AP-07 | Worker user management | - Manage worker accounts: Create new worker accounts, disable existing accounts, and reset passwords. | High |
| FR-AP-08 | Inquiry management | - View submissions from the contact form (processed and stored/forwarded by a Next.js API route). | High |
| FR-AP-09 | Site settings management | - Manage basic site settings such as contact email, phone number, and social media links. <br> - Manage SEO-related metadata for pages (titles, descriptions). | High |

### e.2 Non-functional requirements

| Requirement ID | Requirement | Description | Priority |
|----------------|-------------|-------------|----------|
| NFR-01 | Performance | - Fast page load times, aiming for a Google PageSpeed Insights score of 80+ for both mobile and desktop. <br> - Optimized images using tools like Next.js Image component. <br> - Leverage Server-Side Rendering (SSR) / Static Site Generation (SSG) capabilities of Next.js for optimal performance. | High |
| NFR-02 | SEO | - Semantic HTML markup. <br> - Proper and configurable meta tags, titles, and descriptions for all pages. <br> - Automatic XML sitemap generation. <br> - Clean, human-readable, and crawlable URLs. | High |
| NFR-03 | Responsiveness | - Fully responsive design that adapts seamlessly to all screen sizes, including desktop, tablet, and mobile devices. | High |
| NFR-04 | Security | - HTTPS enforced on all pages. <br> - Secure authentication mechanisms for admin and worker portals (e.g., using NextAuth.js). <br> - Protection against common web vulnerabilities (e.g., XSS, CSRF). <br> - Payment processing must be PCI DSS compliant, achieved by integrating with reputable third-party providers like Stripe or PayPal. | High |
| NFR-05 | Usability | - Intuitive navigation and clear information architecture. <br> - Prominent and unambiguous Calls to Action (CTAs). <br> - Accessible design, considering WCAG AA guidelines. | High |
| NFR-06 | Maintainability | - Well-structured, clean, and commented code. <br> - Easy to update, extend, and debug. | High |
| NFR-07 | Scalability | - The system must be able to handle a growing number of portfolio images and potentially more worker accounts without performance degradation. <br> - Cloud-based image storage is crucial for scalability (e.g., AWS S3, Cloudinary). | High |
| NFR-08 | Browser compatibility | - Support for the latest versions of major web browsers (Chrome, Firefox, Safari, Edge). | High |

## f. User stories and acceptance criteria

### f.1 Prospective Customer

**ST-101: As a prospective customer, I want to easily understand the range of services offered.**
- I want to easily understand the range of services offered.
- **Acceptance Criteria:**
  - Given I am on any page, I can easily find the "Services" navigation link.
  - When I navigate to the services page, I see a clear list or grid of service categories.
  - When I click on a service category, I am taken to a page with a detailed description of that service, as well as before/after images.
  - Service descriptions are easy to read and understand.

**ST-102: As a prospective customer, I want to view high-quality before & after photos of past projects within the relevant service category page.**
- I want to view high-quality before & after photos of past projects within the relevant service category page.
- **Acceptance Criteria:**
  - Given I am on a specific service category page, I see a collection of before & after image pairs relevant to that service.
  - Images are high quality and clearly show the work done.
  - When I click on an image, it opens in a larger lightbox/modal view.
  - Each project/image set can have a brief description.

**ST-103: As a prospective customer, I want to quickly find contact information and service area details.**
- I want to quickly find contact information and service area details.
- **Acceptance Criteria:**
  - Given I am on any page, I can easily find a "Contact" link or section.
  - The contact page clearly displays a phone number, email address, business hours, and a CTA button to submit a service request.
  - The service area is clearly described, potentially with a map.
  - Contact information is also present in the website footer.

**ST-104: As a prospective customer, I want to submit a service inquiry/request for a quote through a simple form.**
- I want to submit a service inquiry/request for a quote through a simple form.
- **Acceptance Criteria:**
  - Given I am on the Contact page or see a "Get a Quote" CTA, I can access an inquiry form.
  - The form is simple and only asks for essential information (e.g., Name, Email, Phone, Service Needed, Brief Description).
  - Upon submission, I receive a confirmation message on the screen.
  - The submitted form data is processed by a Next.js API route (e.g., stored in DB or emailed to Dr. Handyman).
  - The form includes validation for required fields and correct data formats (e.g., email), handled by React Hook Form and Zod.

**ST-105: As a prospective customer, I want to read testimonials from other satisfied customers.**
- I want to read testimonials from other satisfied customers.
- **Acceptance Criteria:**
  - Given I am on the website, I can find a "Testimonials" page or section.
  - Testimonials are displayed clearly, attributed to customers (e.g., name, location if provided).
  - Testimonials appear genuine and build trust.

**ST-106: As a prospective customer, I want to feel confident that Dr. Handyman NC is a trustworthy and professional service provider.**
- I want to feel confident that Dr. Handyman NC is a trustworthy and professional service provider.
- **Acceptance Criteria:**
  - The website has a professional and modern design.
  - Information about licenses, insurance, and guarantees is clearly visible (e.g., on About Us page, footer).
  - The "About Us" page provides a compelling company story and introduces the team.
  - The website is secure (HTTPS).

**ST-107: As a prospective customer, I want to access the website seamlessly on my mobile device or desktop.**
- I want to access the website seamlessly on my mobile device or desktop.
- **Acceptance Criteria:**
  - Given I open the website on a mobile phone, tablet, or desktop, the layout adjusts to my screen size.
  - All content is readable and interactive elements are easily tappable/clickable on all devices.
  - Navigation is intuitive and works well across all device types.
  - Performance is fast on mobile networks as well as Wi-Fi.

### f.2 Existing Customer

**ST-201: As an existing customer, I want to securely pay my invoice online.**
- I want to securely pay my invoice online.
- **Acceptance Criteria:**
  - Given I have an invoice, I can navigate to a "Pay Invoice" or "Payments" page.
  - The payment page provides a secure interface to enter payment details and invoice information (e.g., invoice number, amount).
  - Payment processing is handled by a trusted third-party provider (Stripe/PayPal).
  - I receive a confirmation of successful payment on screen and via email (if email provided).
  - The transaction is secure and my payment information is protected.

**ST-202: As an existing customer, I want to easily find information to re-engage for new services.**
- I want to easily find information to re-engage for new services.
- **Acceptance Criteria:**
  - Given I am a returning customer, I can easily navigate to the services and contact pages.
  - Information about new or existing services is readily available.
  - The process to request a new quote is straightforward.

### f.3 Maintenance Worker

**ST-301: As a maintenance worker, I want to securely log in to a dedicated portal.**
- I want to securely log in to a dedicated portal.
- **Acceptance Criteria:**
  - Given I am a registered worker, I can find a login page for the worker portal.
  - I can enter my credentials (username/email and password) to log in.
  - If I enter incorrect credentials, I see an error message.
  - Once logged in, I am redirected to the worker dashboard.
  - The login process is secure (e.g., password hashing, HTTPS).
  - There is an option for password recovery if I forget my password.

**ST-302: As a maintenance worker, I want to easily upload before & after photos for jobs I've completed.**
- I want to easily upload before & after photos for jobs I've completed.
- **Acceptance Criteria:**
  - Given I am logged into the worker portal, I can access an "Upload Photos" section.
  - I can select/drag & drop separate "before" and "after" image files for a job.
  - The upload interface is user-friendly and provides feedback on upload progress/success/failure.
  - Images are validated (e.g., file type, size).

**ST-303: As a maintenance worker, I want to categorize the photos I upload according to the service performed.**
- I want to categorize the photos I upload according to the service performed.
- **Acceptance Criteria:**
  - Given I am uploading photos, there is a dropdown menu populated with the list of service categories.
  - I must select a service category for each set of before & after photos.
  - The selected category is saved with the uploaded images.

**ST-304: As a maintenance worker, I want to add brief descriptions or notes to my photo uploads.**
- I want to add brief descriptions or notes to my photo uploads.
- **Acceptance Criteria:**
  - Given I am uploading photos, there is a text field where I can add a brief description or notes about the job.
  - The description is optional.
  - The entered description is saved with the uploaded images.

**ST-305: As a maintenance worker, I want my uploaded photos to be submitted for admin approval.**
- I want my uploaded photos to be submitted for admin approval.
- **Acceptance Criteria:**
  - Given I have successfully uploaded photos, they are marked as "Pending Approval."
  - I can see the status of my uploads in my worker dashboard.
  - The photos do not appear on the public website until approved by an administrator.

### f.4 Site Administrator

**ST-401: As a site administrator, I want to securely log in to a secure admin panel.**
- I want to securely log in to a secure admin panel.
- **Acceptance Criteria:**
  - Given I am a registered administrator, I can find a login page for the admin panel (distinct from worker login).
  - I can enter my admin credentials to log in.
  - Login is secure and protects against unauthorized access.
  - Upon successful login, I am redirected to the admin dashboard.
  - There is an option for password recovery.

**ST-402: As a site administrator, I want to manage (add, edit, delete) service categories and detailed service descriptions.**
- I want to manage (add, edit, delete) service categories and detailed service descriptions.
- **Acceptance Criteria:**
  - Given I am logged into the admin panel, I can access a "Services Management" section.
  - I can add a new service category with a name, description, and associated images.
  - I can edit the details of existing service categories.
  - I can delete service categories (with a confirmation step).
  - Changes made are reflected on the public-facing website.

**ST-403: As a site administrator, I want to manage (approve, edit, delete) all portfolio images, including those uploaded by workers.**
- I want to manage (approve, edit, delete) all portfolio images, including those uploaded by workers.
- **Acceptance Criteria:**
  - Given I am logged into the admin panel, I can access a "Portfolio Management" section.
  - I can see a list of portfolio items, including those pending approval from workers.
  - I can approve or reject worker-uploaded photos.
  - I can edit image details (e.g., title, description, category) for any portfolio item.
  - I can delete portfolio items.
  - I can upload new before & after photos directly.
  - Approved photos appear within the gallery section of their respective service category pages.

**ST-404: As a site administrator, I want to update general site content (e.g., About Us, FAQ, contact info).**
- I want to update general site content (e.g., About Us, FAQ, contact info).
- **Acceptance Criteria:**
  - Given I am logged into the admin panel, I can access a "Page Management" or "Content Management" section.
  - I can edit the textual and image content for pages like "About Us", "FAQ".
  - I can update contact information (phone, email, address) that appears on the site.
  - Changes are saved and reflected on the public website.

**ST-405: As a site administrator, I want to manage worker accounts (add, remove, reset passwords).**
- I want to manage worker accounts (add, remove, reset passwords).
- **Acceptance Criteria:**
  - Given I am logged into the admin panel, I can access a "User Management" or "Worker Accounts" section.
  - I can add new worker accounts by providing necessary details (e.g., name, email, temporary password).
  - I can disable or enable existing worker accounts.
  - I can trigger a password reset for a worker account.
  - I can delete worker accounts.

**ST-406: As a site administrator, I want to view and manage inquiries received through the website.**
- I want to view and manage inquiries received through the website.
- **Acceptance Criteria:**
  - Given I am in the admin panel, there is a clear way to access inquiries (e.g., a dedicated "Inquiries" section displaying data captured by Next.js API routes).
  - I can see all inquiries submitted through the website contact form.

**ST-407: As a site administrator, I want to manage testimonials.**
- I want to manage testimonials.
- **Acceptance Criteria:**
  - Given I am logged into the admin panel, I can access a "Testimonials Management" section.
  - I can add new testimonials manually.
  - I can edit existing testimonials.
  - I can approve or hide testimonials.
  - I can delete testimonials.
  - Approved testimonials are displayed on the public website.

**ST-408: As a site administrator, I want to potentially integrate with a payment system to track payments or generate payment links.**
- I want to potentially integrate with a payment system to track payments or generate payment links.
- **Acceptance Criteria:**
  - Given I am in the admin panel, I can access a "Payments" section.
  - I can view a list of online payments made through the site (if direct integration allows).
  - OR I have easy access to the payment provider's dashboard (Stripe/PayPal) to view transactions.
  - (Future) Ability to generate payment links for specific services or amounts.

**ST-409: As a site administrator, I want the system to have well-defined database models for storing application data.**
- I want the system to have well-defined database models for storing application data.
- **Acceptance Criteria:**
  - Given the application uses a database, the schema for users (admins, workers), services, portfolio items (images, descriptions, categories), and testimonials is clearly defined.
  - Relationships between entities are correctly established (e.g., a portfolio item belongs to a service category).
  - Data types are appropriate for the stored information.
  - The database design supports all required application functionalities and queries efficiently.

## g. Technical requirements / stack

A guiding principle for technology selection is to prioritize free and open-source solutions whenever they meet the project's functional, non-functional, and scalability requirements. If paid services are considered, their free tiers should be thoroughly evaluated first.

**Recommended Simple Stack:**

*   **Framework:** Next.js (React framework, with a focus on Static Site Generation (SSG) for most public-facing pages for optimal performance and SEO).
*   **Styling:** Tailwind CSS (for rapid, consistent UI development with a utility-first approach).
*   **Backend/API:** Next.js API Routes (utilizing the Node.js environment for server-side logic, including form data processing).
*   **Forms (Client-side):** React Hook Form + Zod (for efficient form handling and robust schema-based validation).
*   **Form Submission (Backend):** Next.js API Routes will handle form submissions (e.g., storing data, sending email notifications).
*   **Image Upload Handling:** Next.js API route utilizing `multer` for processing and temporarily storing image uploads before moving to permanent storage.
*   **Payment Processing:** Stripe Checkout (for a secure, PCI-compliant, and minimally complex integration for online payments).
*   **State Management:** Primarily rely on Next.js/React component state and context API. A global state management library (e.g., Zustand, Redux Toolkit) is likely not needed for this project's scope but can be considered if complexity grows significantly.

**Alternative/Additional Considerations & Original Stack Components:**

*   **Database:**
      *   Primary Recommendations (for simplicity and quick setup):
          *   Vercel Postgres (Managed, serverless PostgreSQL, integrates well with Vercel deployments, offers a generous free tier).
          *   Firebase (Firestore - NoSQL, or Realtime Database - NoSQL) (BaaS with generous free tier, very easy to integrate and get started quickly, especially for simpler data models).
      *   Other Alternatives (Original):
          *   Self-hosted PostgreSQL (Robust, relational, open-source, offers maximum control but requires more setup and maintenance).
          *   Supabase (PostgreSQL-based BaaS, offers a free tier, good alternative to Firebase if relational data is strongly preferred).
      *   Evaluate free tier limitations and project data structure needs carefully when choosing.
*   **Authentication:** NextAuth.js (highly recommended for its seamless integration with Next.js and comprehensive features for handling authentication for both worker and admin portals).
*   **Image Storage (Permanent):**
    *   Primary Recommendation (Original): Utilize the free tiers of cloud-based solutions like Cloudinary (offers image manipulation) or other services providing object storage (e.g., AWS S3, Google Cloud Storage). Evaluate free tier limitations (storage capacity, bandwidth, feature restrictions) carefully. If self-hosting is not feasible, select the most cost-effective cloud solution that meets requirements, starting with its free tier.
*   **Admin panel/CMS:**
    *   Option 1 (Preferred for simplicity and control, aligns with Recommended Stack): Simple admin panel built as part of the Next.js application.
    *   Option 2 (If more complex CMS features are deemed necessary - Original): Headless CMS (e.g., Strapi (open-source, self-hostable), Sanity.io, Contentful). If a Headless CMS is chosen, prioritize self-hostable open-source options or those with comprehensive free tiers.
*   **Styling (Alternative):** CSS Modules (if Tailwind CSS is not preferred).
*   **Deployment:**
    *   Primary Recommendation (Original): Leverage the free tiers of platforms like Vercel (ideal for Next.js) or Netlify.
    *   Alternative (Original): For greater control or to minimize long-term costs, explore self-hosting on a Virtual Private Server (VPS) using Docker containers and open-source web servers like Nginx or Caddy. This requires more setup and maintenance effort.
*   **Analytics:** Google Analytics (for tracking website traffic and user behavior).
*   **Code repository:** Git (e.g., GitHub, GitLab, Bitbucket).
*   **Development environment:** Node.js, pnpm/npm/yarn.

## h. Design and user interface

*   **Branding:**
    *   Adhere to Dr. Handyman's existing branding elements (logo, color scheme if available).
    *   If no established branding exists, develop a new, professional color palette that evokes trust, reliability, and craftsmanship (e.g., blues, greens, greys, with accent colors).
*   **Visuals:**
    *   High-quality, professional photography is paramount, especially for the portfolio section. All "before & after" shots must be clear and well-lit.
    *   Stock imagery should be used sparingly and only if it is high-quality and aligns with the brand's professional image. Avoid generic or cliché stock photos.
*   **Layout:**
    *   Clean, modern, and uncluttered design aesthetic.
    *   Ample white space to improve readability and focus.
    *   Consistent layout structure across all pages.
    *   Mobile-first design approach, ensuring an excellent experience on smaller screens, then scaling up for tablets and desktops.
*   **Typography:**
    *   Use legible and professional web fonts. Choose a font pairing that is easy to read for both headings and body text.
    *   Ensure sufficient font sizes and line heights for readability, especially on mobile devices.
*   **Navigation:**
    *   Simple, intuitive, and consistent main navigation menu, easily accessible on all devices.
    *   Clear footer navigation for secondary links (e.g., privacy policy, terms of service, sitemap).
    *   Breadcrumbs on inner pages if the site structure becomes deep, to aid user orientation.
*   **Calls to action (CTAs):**
    *   Prominently displayed, clear, and concise CTAs (e.g., "Get a Free Quote," "View Our Work," "Pay Your Invoice," "Contact Us").
    *   Visually distinct CTAs using contrasting colors and clear button styling.
    *   Strategically placed CTAs to guide users towards desired actions.
*   **User experience (UX):**
    *   Intuitive user flows for all key tasks (e.g., requesting a quote, making a payment, uploading photos).
    *   Minimize clicks required to reach important information or complete tasks.
    *   Provide clear feedback to user interactions (e.g., form submission success/error messages, loading indicators).
    *   Ensure the website is accessible, aiming for WCAG 2.1 AA compliance. This includes considerations for keyboard navigation, screen reader compatibility, and sufficient color contrast.
*   **Forms:**
    *   Forms should be simple, with clearly labeled fields.
    *   Use inline validation and provide helpful error messages.
    *   Break down long forms into steps if necessary.

This PRD aims to cover all essential aspects for the Dr. Handyman NC Website Revamp. It should be considered a living document and may be updated as the project progresses and new information becomes available.
