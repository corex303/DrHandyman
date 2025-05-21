# Dr. Handyman NC Website

A professional website for Dr. Handyman, a handyman service provider specializing in home repairs, renovations, and maintenance services.

## Features

- **Public Website:** Showcase services, portfolio of past work, and customer testimonials
- **Payment Integration:** Securely accept online payments via Stripe
- **Worker Portal:** Allow workers to upload before/after photos of completed jobs
- **Admin Panel:** Manage services, portfolio, testimonials, and worker accounts

## Tech Stack

- **Frontend:** Next.js 14 with App Router, React 18, TypeScript, Tailwind CSS
- **Authentication:** NextAuth.js with role-based access control
- **Forms:** React Hook Form with Zod validation
- **Payment Processing:** Stripe integration
- **Styling:** Tailwind CSS with customizable theme
- **Image Storage:** Cloud storage integration for worker photo uploads
- **SEO:** Built-in SEO optimization with metadata, sitemaps, and structured data

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm package manager

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd dr-handyman
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables

4. Start the development server
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- **`src/app`**: Next.js App Router pages and layout
- **`src/components`**: Reusable UI components
- **`src/lib`**: Utility functions and helpers
- **`src/styles`**: Global styles and Tailwind configuration

## Development Guidelines

- Follow the established coding patterns and style guidelines
- Run tests before submitting code changes
- Use conventional commit messages for version control

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.
