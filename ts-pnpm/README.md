# Dr. Handyman Next.js Project

This is the Next.js project for Dr. Handyman, a comprehensive platform for managing handyman services, customer interactions, and administrative tasks.

This project is built upon the `ts-nextjs-tailwind-starter` template and has been customized for Dr. Handyman specific needs.

## Getting Started

### Prerequisites

- Node.js (version specified in `.nvmrc`)
- pnpm
- PostgreSQL database

### Environment Variables

Create a `.env.local` file in the `ts-pnpm` directory by copying `.env.example`. Fill in the necessary environment variables, including:

- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_URL`: The base URL of your application (e.g., `http://localhost:3000`).
- `NEXTAUTH_SECRET`: A random string used to hash tokens, sign cookies and generate cryptographic keys. You can generate one using `openssl rand -hex 32`.
- Optional: Cloudinary credentials if image uploads to Cloudinary are being used.

Refer to `.env.example` for a full list of potential variables.

### Installation

1. Navigate to the `ts-pnpm` directory:
   ```bash
   cd ts-pnpm
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your database and run migrations:
   ```bash
   pnpm prisma migrate dev
   ```
4. Seed the database (optional, if seed script is configured):
   ```bash
   pnpm prisma db seed
   ```

### Running the Development Server

```bash
cd ts-pnpm
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Features & Technologies

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- NextAuth.js (for customer portal authentication)
- Simple password-based auth (for Admin/Worker portals)
- React Hook Form & Zod (for form validation)
- Cloudinary (for image management - configurable)
- Vercel (for deployment and blob storage)

## Project Structure (within ts-pnpm)

- `src/app/`: Main application code using Next.js App Router.
  - `(admin)/`: Admin portal specific routes and components.
  - `(maintenance)/`: Maintenance worker portal specific routes and components.
  - `(public)/`: Public facing website routes and components.
  - `api/`: API route handlers.
- `src/components/`: Reusable UI components.
- `src/lib/`: Utility functions, Prisma client, etc.
- `prisma/`: Prisma schema and migration files.
- `public/`: Static assets.

## Deployment

This project is configured for deployment on Vercel. Commits to the main branch will trigger automatic deployments.

## Contributing

Please follow standard Git workflow practices. Ensure commits are descriptive and atomic.

---

*This README has been updated for the Dr. Handyman project.*
