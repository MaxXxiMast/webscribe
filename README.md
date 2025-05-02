# Browserless PDF Generator (Scrollflow)

An authenticated, multi-user web-to-PDF SaaS built with Next.js, NextAuth, Prisma, and Browserless. Users can sign in via GitHub, generate PDF snapshots of URLs, preview and download them, and view their PDF history.

## 🚀 Setup & Run Locally

### 1. Prerequisites

-   Node.js v16+ and npm installed.
-   Git client.

### 2. Clone the Repository

```bash
git clone git@github.com:MaxXxiMast/scrollflow.git
cd scrollflow
```

### 3. Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Set the following in `.env`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-a-strong-secret>"
GOOGLE_CLIENT_ID=<your-github-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-github-oauth-client-secret>
BROWSERLESS_API_KEY=<your-browserless-token>
```

### 4. Install Dependencies & Generate Prisma Client

```bash
npm install
npx prisma generate
```

### 5. Database Migration (SQLite)

```bash
npx prisma migrate dev --name init_sqlite
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to use the app.

### 7. Build for Production

```bash
npm run build
npm start
```

## 📦 Deployment

For Vercel:

1. Ensure `postinstall` or `prepare` script runs `prisma generate` in `package.json`.
2. Set above environment variables in Vercel dashboard.
3. Push to Git; Vercel will build and deploy automatically.

## 🏗 Architecture Overview

```
src/
├── pages/              # Next.js Pages Router
│   ├── _app.js         # App wrapper with SessionProvider
│   ├── index.jsx       # Landing page + PDF generator + history table
│   ├── dashboard.jsx   # (Optional) separate history page
│   └── api/            # API routes
│       ├── auth/       # NextAuth endpoints
│       │   └── [...nextauth].js
│       └── generate-pdf.js  # PDF generation endpoint
├── components/         # Client components
│   └── PDFGenerator.jsx  # URL input, generate button, preview pane
├── lib/                # Browserless & Puppeteer helper
│   └── browserless.js
├── validation/         # Zod schemas
│   └── schema.js
└── public/             # Static assets
    └── pdfs/           # Generated PDF files

prisma/
└── schema.prisma       # Data models: User, PdfRecord, Account, Session, VerificationToken
```

### Data Flow

1. **Authentication** via NextAuth (Google) stores users in SQLite (Prisma).
2. **PDF Generation**: `/api/generate-pdf` reads session; looks up user by email; launches Browserless & Puppeteer; navigates to URL; waits for images; streams PDF back to client while saving to `public/pdfs`; writes a `PdfRecord`.
3. **Frontend** displays generator form and preview pane; after generation, shows an embedded `<object>` PDF preview and a download link.
4. **History**: `getServerSideProps` in `index.jsx` reads `PdfRecord` entries for the signed-in user, serializes timestamps, and renders a table with date, URL, preview, and download.

## 🔒 Authentication

-   Providers: Google OAuth.
-   Session strategy: database (Prisma adapter).
-   Session contains `{ name, email, image }` only; user ID is looked up server-side by email to avoid exposing internal IDs.

## 📄 PDF Generation Endpoint

-   **Route**: `POST /api/generate-pdf`
-   **Payload**: `{ url: string }`
-   **Validation**: Zod enforces a valid URL.
-   **Browserless**: connect via WebSocket; uses Puppeteer.
-   **Image Handling**: track network requests for images, wait until all complete or timeout.
-   **Streaming**: WHATWG stream to Node response and simultaneously write to disk.
-   **Database**: create `PdfRecord` with scalar `userId`, `url`, and file path.

---

Enjoy building with Scrollflow!
