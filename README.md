# Shopkeeper Dashboard

ERP Shopkeeper Portal built with Next.js 16, React 19, and Tailwind CSS.

## Features

- **Authentication**: Google Sign-In for shopkeepers
- **Inventory Management**:
  - View inventory with filters and pagination
  - Inline editing of inventory items
  - Upload XLSX files for bulk inventory import
  - Generate barcodes for Chinese products
  - Map barcodes to non-Chinese products
  - Print barcode PDFs
- **Reports**: Download daily and monthly reports in CSV/PDF format
- **Orders**: View order list with search and detailed order modal
- **Customers**: View customer list with pagination

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running (default: http://localhost:8000)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file (copy from `example.env`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

3. Set up Google OAuth:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized JavaScript origins: `http://localhost:3001`
   - Add authorized redirect URIs: `http://localhost:3001`
   - Copy the Client ID to your `.env.local` file as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API base URL (default: http://localhost:8000/api/v1)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth 2.0 Client ID

## Project Structure

```
shopkeeper_dashboard/
├── app/                    # Next.js app router pages
│   ├── login/             # Login page
│   ├── orders/            # Orders page
│   ├── customers/         # Customers page
│   └── reports/           # Reports page
├── components/            # React components
│   ├── Layout.tsx         # Main layout with navigation
│   ├── ProtectedRoute.tsx # Route protection wrapper
│   ├── InventoryPage.tsx  # Inventory management
│   ├── OrdersPage.tsx     # Order listing
│   ├── CustomersPage.tsx  # Customer listing
│   └── ReportsPage.tsx    # Report downloads
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
└── lib/                   # Utilities
    ├── api.ts             # API client
    ├── auth.ts            # Auth service
    └── googleAuth.ts      # Google OAuth utilities
```

## API Integration

The dashboard integrates with the backend API at `/api/v1`. All authenticated requests include a JWT token in the `Authorization` header.

## Build for Production

```bash
npm run build
npm start
```
