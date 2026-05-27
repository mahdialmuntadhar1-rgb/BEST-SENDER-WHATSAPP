# Nabda Bulk WhatsApp Messaging System

A production-ready bulk WhatsApp messaging system using the Nabda OTP API.

## Tech Stack

### Backend
- **Node.js** (v20+) + **Express** + **TypeScript**
- **MongoDB** (Mongoose) for contacts, campaigns, templates, logs
- **BullMQ** with **Redis** for job queuing
- **Multer** for CSV file upload
- **Zod** + **express-validator** for validation
- **dotenv** for environment variables

### Frontend
- **React** + **TypeScript**
- **Vite** for build tooling
- **React Router** for routing
- **TailwindCSS** for styling
- **Axios** for API calls
- **Lucide React** for icons

## Project Structure

```
nabda-bulk-whatsapp/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── queues/          # BullMQ job queues
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration files
│   │   ├── types/           # TypeScript types
│   │   ├── app.ts           # Express app setup
│   │   └── index.ts         # Server entry point
│   ├── .env.example         # Environment variables template
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── .env.example         # Environment variables template
│   ├── package.json         # Frontend dependencies
│   ├── tailwind.config.js   # TailwindCSS configuration
│   └── vite.config.ts       # Vite configuration
└── README.md                # This file
```

## Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/nabda-bulk-whatsapp

# Redis Configuration (for BullMQ)
REDIS_URL=redis://localhost:6379

# Nabda API Configuration
NABDA_API_BASE_URL=https://api.nabdaotp.com
NABDA_API_KEY=sk_your_api_key_here
NABDA_INSTANCE_ID=your_instance_id_here

# JWT Secret (optional, for user sessions)
JWT_SECRET=your_jwt_secret_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## Installation

### Prerequisites
- Node.js v20+
- MongoDB
- Redis

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Contacts
- `GET /api/contacts` - Get all contacts
- `POST /api/contacts` - Create a new contact
- `PUT /api/contacts/:id` - Update a contact
- `DELETE /api/contacts/:id` - Delete a contact

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create a new campaign
- `PUT /api/campaigns/:id` - Update a campaign
- `DELETE /api/campaigns/:id` - Delete a campaign
- `POST /api/campaigns/:id/send` - Send a campaign

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create a new template
- `PUT /api/templates/:id` - Update a template
- `DELETE /api/templates/:id` - Delete a template

### Message Logs
- `GET /api/message-logs` - Get message logs (optional: ?campaignId=xxx)

### Nabda API
- `POST /api/nabda/send` - Send a WhatsApp message
- `POST /api/nabda/otp` - Send an OTP
- `GET /api/nabda/balance` - Get Nabda balance
- `GET /api/nabda/templates` - Get available Nabda templates

## Database Models

### Contact
- name (string, required)
- phone (string, required, unique)
- email (string, optional)
- category (string, optional)
- governorate (string, optional)
- tags (array of strings, optional)

### Campaign
- name (string, required)
- message (string, required)
- templateId (string, optional)
- recipients (array of strings, required)
- status (enum: draft, scheduled, sending, completed, failed)
- scheduledAt (date, optional)
- sentAt (date, optional)
- completedAt (date, optional)
- stats (object: total, sent, failed, pending)

### Template
- name (string, required, unique)
- content (string, required)
- variables (array of strings, optional)
- category (string, optional)
- isActive (boolean, default: true)

### MessageLog
- campaignId (ObjectId, optional)
- recipient (string, required)
- message (string, required)
- status (enum: pending, sent, delivered, failed)
- nabdaMessageId (string, optional)
- error (string, optional)
- sentAt (date, optional)
- deliveredAt (date, optional)

## Development

### Backend
```bash
cd backend
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript to JavaScript
npm start          # Start production server
```

### Frontend
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Features

- **Dashboard**: Overview of system status, balance, contacts, and campaigns
- **Contacts Management**: Add, edit, delete contacts with CSV import support
- **Campaign Management**: Create and manage bulk messaging campaigns
- **Templates**: Create reusable message templates
- **Message Queue**: BullMQ with Redis for reliable message delivery
- **Real-time Status**: Track campaign progress and message delivery status
- **Nabda Integration**: Full integration with Nabda OTP API for WhatsApp messaging

## License

MIT
