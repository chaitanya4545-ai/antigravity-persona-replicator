# Gmail OAuth Setup Instructions

## Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=1042864536606-qgnrn4du5fkoc7r8bu7k5utj77evftm1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:5173/email/callback
```

## For Render Deployment:

Add these environment variables in Render dashboard:
- `GOOGLE_CLIENT_ID`: 1042864536606-qgnrn4du5fkoc7r8bu7k5utj77evftm1.apps.googleusercontent.com
- `GOOGLE_CLIENT_SECRET`: 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
- `GOOGLE_REDIRECT_URI`: https://antigravity-persona-replicator.onrender.com/email/callback
