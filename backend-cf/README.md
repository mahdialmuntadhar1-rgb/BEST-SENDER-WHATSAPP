# Nabda Bulk WhatsApp - Cloudflare Workers Version

A production-ready bulk WhatsApp messaging system using the Nabda OTP API, built entirely on Cloudflare Workers.

## Tech Stack

- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono.js (lightweight web framework)
- **Database**: D1 (SQLite on Cloudflare)
- **Storage**: R2 (S3-compatible object storage)
- **Queue**: Cloudflare Queues (message processing)
- **State**: Durable Objects (job tracking)
- **Cache**: KV (rate limiting)
- **Language**: TypeScript

## Architecture

```
┌─────────────────┐
│   Cloudflare     │
│     Workers      │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬──────────────┬──────────────┐
    │         │              │              │              │
    ▼         ▼              ▼              ▼              ▼
┌────────┐ ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
│   D1   │ │  R2  │    │ Queue│    │  KV  │    │  DO  │
│  (DB)  │ │(Files)│    │(Jobs)│    │(Cache)│    │(State)│
└────────┘ └──────┘    └──────┘    └──────┘    └──────┘
```

## Features

- **Contact Management**: CRUD operations with governorate and language detection
- **CSV Import**: Bulk contact import with R2 storage and progress tracking
- **Campaign Management**: Create and manage bulk messaging campaigns
- **Message Queuing**: Cloudflare Queues for reliable message delivery
- **Authentication**: JWT-based auth with Nabda API integration
- **Rate Limiting**: KV-based rate limiting
- **Phone Normalization**: Automatic Iraqi phone number formatting
- **Language Detection**: Auto-detect Arabic/Sorani/Bahdini based on governorate

## Project Structure

```
nabda-bulk-whatsapp-cf/
├── src/
│   ├── db/
│   │   └── d1-client.ts          # D1 database wrapper
│   ├── middleware/
│   │   └── auth.ts               # JWT & rate limiting middleware
│   ├── routes/
│   │   ├── contacts.ts           # Contact CRUD routes
│   │   ├── campaigns.ts          # Campaign CRUD routes
│   │   ├── uploads.ts            # R2 upload routes
│   │   └── auth.ts               # Authentication routes
│   ├── utils/
│   │   ├── encryption.ts         # AES-256-GCM encryption
│   │   ├── phone-normalization.ts # Phone number formatting
│   │   └── language-detection.ts  # Language detection logic
│   ├── durable-objects/
│   │   └── job-status.ts         # Job tracking DO
│   ├── workers/
│   │   └── message-worker.ts     # Queue consumer
│   └── index.ts                  # Main entry point
├── migrations/
│   └── 001_initial.sql           # D1 schema
├── wrangler.toml                 # Cloudflare config
├── package.json                  # Dependencies
├── tsconfig.json                  # TypeScript config
└── README.md
```

## Deployment Instructions

### 1. Install Dependencies

```bash
cd nabda-bulk-whatsapp-cf
npm install
```

### 2. Create Cloudflare Resources

```bash
# Create D1 database
npm run d1:create

# Update wrangler.toml with the returned database_id

# Run migrations
npm run d1:migrate

# Create R2 bucket
npm run r2:create

# Create KV namespace
npm run kv:create

# Update wrangler.toml with the returned KV id
```

### 3. Set Secrets

```bash
# Set Nabda API credentials
wrangler secret put NABDA_API_KEY
wrangler secret put NABDA_API_BASE_URL

# Set JWT secret
wrangler secret put JWT_SECRET

# Set encryption key (min 32 characters)
wrangler secret put ENCRYPTION_KEY
```

### 4. Update wrangler.toml

Replace placeholder values in `wrangler.toml`:
- `database_id` - Your D1 database ID
- `id` (in kv_namespaces) - Your KV namespace ID
- `CORS_ORIGIN` - Your frontend domain

### 5. Deploy

```bash
npm run deploy
```

### 6. Local Development

```bash
npm run dev
```

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Authentication
- `POST /api/auth/nabda/login` - Login with Nabda credentials
- `GET /api/auth/nabda/instance` - Get current instance info
- `POST /api/auth/nabda/select-instance` - Select instance
- `POST /api/auth/logout` - Logout

### Contacts
- `GET /api/contacts` - List contacts (pagination, filters)
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `DELETE /api/contacts/bulk` - Bulk delete
- `GET /api/contacts/governorates/counts` - Contact counts by governorate

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/send` - Send campaign

### Uploads
- `POST /api/uploads/presigned-url` - Get R2 upload URL
- `POST /api/uploads/process` - Process uploaded CSV

## Environment Variables

Set via `wrangler secret put`:
- `NABDA_API_KEY` - Your Nabda API key
- `NABDA_API_BASE_URL` - Nabda API base URL (default: https://api.nabdaotp.com)
- `JWT_SECRET` - JWT signing secret
- `ENCRYPTION_KEY` - Encryption key for API keys (min 32 chars)

Set in `wrangler.toml`:
- `CORS_ORIGIN` - Frontend domain for CORS

## Iraqi Governorates

The system supports all 20 Iraqi governorates with automatic language detection:

**Arabic**: Baghdad, Basra, Najaf, Karbala, Mosul, Anbar, Diyala, Wasit, Maysan, Dhi Qar, Babil, Qadisiyah, Muthanna, Salah ad Din

**Sorani**: Sulaymaniyah, Halabja, Erbil, Kirkuk

**Bahdini**: Duhok, Zakho

## Frontend Integration

Update your frontend API client to point to the Cloudflare Workers URL:

```typescript
const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev/api';
```

## Queue Processing

Messages are processed via Cloudflare Queues with:
- **Batch size**: 10 messages per batch
- **Max wait**: 5 seconds
- **Retry logic**: Exponential backoff (max 3 retries)
- **Dead letter**: Failed messages after max retries

## Limitations

- D1 has a 5GB limit per database
- R2 has a 5TB limit per bucket
- Workers have 10ms CPU time limit per request
- Queue messages must be processed within 30 days

## Monitoring

Monitor your deployment via:
- Cloudflare Dashboard
- Wrangler CLI: `wrangler tail`
- Workers Analytics in dashboard

## License

MIT
