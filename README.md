# Meta Manage Magic

Booking and operations dashboard for a service business, used to manage customer bookings, payments, feedback, and uploaded job photos.

## What this app does

- Service request booking flow for customers
- Staff dashboard for viewing bookings and updating status
- Payment review and approval workflow
- Customer feedback / complaints inbox
- Photo uploads and gallery review for each booking
- Public service pages and booking entry points

## Stack

- TypeScript
- React + TanStack Start / Router
- Vite
- Supabase for auth and storage
- Tailwind CSS and shadcn-style UI primitives

## Local development

```bash
npm install
npm run dev
```

## Project notes

This repository is not a social-media profile or generic business landing page. The app and routes are organized around booking management, public service pages, and internal admin tools.

## Important repo hygiene

- Keep environment variables in local `.env` files only.
- Do not commit private credentials, upload tokens, or project secrets.
