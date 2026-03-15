# Antigravity Persona Replicator
<!-- Deployment Trigger: 2026-03-15 -->

AI-powered digital twin for email communication. Train your persona, generate authentic replies, and automate your inbox while maintaining your unique voice.

## Features

- 🤖 **AI-Powered Persona Replication** - Train your digital twin using your writing samples
- 📧 **Email Automation** - Generate authentic replies that match your style
- 🎯 **Three Confidence Levels** - Conservative, Normal, and Bold reply options
- 🔒 **Privacy-First** - Your data stays secure and under your control
- 📊 **Analytics Dashboard** - Track usage, confidence scores, and approval rates
- ⚡ **Real-time Generation** - Instant reply suggestions powered by GPT-4

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Axios for API communication
- Modern, responsive UI with gradient designs

### Backend
- Node.js + Express
- PostgreSQL database
- JWT authentication
- OpenAI GPT-4 integration
- File upload with Multer

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+
- OpenAI API key

### Local Development

1. **Clone the repository**
```bash
cd "C:\Users\Chaitanya\Downloads\Chaitanya Python\antigravity-persona-replicator"
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - Your OpenAI API key
- `JWT_SECRET` - Random secret for JWT tokens

3. **Install dependencies**

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

4. **Set up database**
```bash
cd backend
npm run migrate
```

5. **Start development servers**

Backend (in `backend/` directory):
```bash
npm run dev
```

Frontend (in `frontend/` directory):
```bash
npm run dev
```

6. **Open your browser**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Using Docker Compose

For easier setup, use Docker Compose:

```bash
docker-compose up
```

This will start PostgreSQL, backend, and frontend services automatically.

## Project Structure

```
antigravity-persona-replicator/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Node.js backend
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # Auth middleware
│   ├── db/                  # Database config
│   ├── server.js            # Express server
│   └── package.json
├── docker-compose.yml       # Docker setup
└── .env.example             # Environment template
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Personas
- `GET /api/personas/me` - Get user's persona
- `POST /api/personas/ingest` - Upload training samples
- `POST /api/personas/retrain` - Retrain persona

### Messages
- `GET /api/messages/inbox` - Get inbox messages
- `POST /api/messages/:id/generate` - Generate twin reply
- `POST /api/messages/:id/send` - Send message

### Activity
- `GET /api/activity` - Get recent activity
- `GET /api/metrics` - Get usage metrics

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel (Frontend)
- Railway (Backend + Database)
- AWS / Render alternatives

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `JWT_SECRET` - Secret for JWT tokens

Optional:
- `PORT` - Backend port (default: 5000)
- `FRONTEND_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment (development/production)

## Contributing

This is an MVP project. Contributions welcome!

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ using React, Node.js, and OpenAI GPT-4
