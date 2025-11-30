# ThunderStrike API - Intelligent Chaos Testing Platform

A comprehensive platform for stress-testing APIs with intelligent chaos scenarios and AI-powered post-mortem reports.

## Features

- **Target API Management**: Register and manage API endpoints for testing
- **Chaos Scenarios**: 
  - Random latency patterns
  - Payload corruption testing
  - Authentication failure simulation
  - Burst traffic and rate-limit testing
- **Metrics Collection**: Detailed performance and error metrics
- **AI-Powered Reports**: Automated post-mortem analysis with recommendations

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: MongoDB
- **Queue**: BullMQ + Redis
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **AI**: OpenAI API integration (configurable)

## Prerequisites

- Node.js 18+ and npm/pnpm
- Docker and Docker Compose (for MongoDB and Redis)
- Git

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/abhi3114-glitch/ThunderStrike-API.git
cd ThunderStrike-API
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create `.env` file in the `backend` directory:
```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/thunderstrike

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI (optional - for AI report generation)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# CORS
FRONTEND_URL=http://localhost:5173
```

### 4. Start Infrastructure Services

Start MongoDB and Redis using Docker Compose:
```bash
docker-compose up -d
```

### 5. Run the Application

**IMPORTANT:** You must run the following processes in separate terminals:

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Chaos Worker (REQUIRED):**
```bash
cd backend
npm run worker
```

**Note:** The chaos worker is essential for processing test jobs. Without it, tests will remain in "queued" status indefinitely.

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:5173`

### Verify Installation

You should see the following confirmations:
- MongoDB connected successfully
- Redis connected successfully
- API server running on port 3001
- Chaos test worker started and listening for jobs
- Frontend development server running

## API Documentation

### Targets

- `POST /api/targets` - Create a new target API
- `GET /api/targets` - List all targets
- `GET /api/targets/:id` - Get target details
- `DELETE /api/targets/:id` - Delete a target

### Chaos Tests

- `POST /api/tests` - Create and queue a new chaos test
- `GET /api/tests` - List all tests
- `GET /api/tests/:id` - Get test details and metrics

### AI Reports

- `GET /api/reports/:id` - Get AI-generated post-mortem report

## Chaos Scenarios

1. **Latency Testing**: Simulates variable network delays
2. **Payload Corruption**: Tests API resilience with malformed data
3. **Auth Failure**: Validates authentication error handling
4. **Rate Limit/Burst**: Tests API behavior under high load

## Project Structure
```
thunderstrike-api/
├── backend/
│   ├── src/
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # Express routes
│   │   ├── services/        # Business logic
│   │   ├── workers/         # BullMQ workers
│   │   ├── chaos/           # Chaos testing engine
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

## Security Notes

- Never commit `.env` files or API keys to the repository
- The provided GitHub token in the project description should be rotated immediately
- Use environment variables for all sensitive configuration

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
