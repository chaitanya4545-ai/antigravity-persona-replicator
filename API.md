# API Documentation

Complete API reference for the Antigravity Persona Replicator backend.

**Base URL**: `http://localhost:5000/api` (development) or `https://your-backend.railway.app/api` (production)

---

## Authentication

All authenticated endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### POST /auth/signup

Create a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token-here"
}
```

### POST /auth/login

Login to existing account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "jwt-token-here"
}
```

### GET /auth/me

Get current user information. **Requires authentication**.

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Personas

### GET /personas/me

Get user's persona. **Requires authentication**.

**Response** (200):
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "My Twin",
  "metadata": {
    "tone": "Direct, professional",
    "riskLevel": "Medium",
    "commonPhrases": ["Let's sync up", "Moving forward"],
    "sampleCount": 5,
    "lastTrained": "2024-01-01T00:00:00Z"
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### POST /personas/ingest

Upload training samples. **Requires authentication**.

**Request**: `multipart/form-data`
- `files`: Array of files (max 10)

**Accepted file types**:
- Documents: `.txt`, `.docx`, `.pdf`
- Emails: `.eml`
- Audio: `.mp3`, `.wav`, `.m4a`

**Response** (200):
```json
{
  "samples": [
    {
      "id": "uuid",
      "name": "sample.txt",
      "size": 1024
    }
  ],
  "message": "Files uploaded successfully"
}
```

### POST /personas/retrain

Retrain persona with uploaded samples. **Requires authentication**.

**Response** (200):
```json
{
  "persona": {
    "id": "uuid",
    "metadata": {
      "tone": "Direct, professional",
      "riskLevel": "Medium",
      "commonPhrases": ["Let's sync up"],
      "sampleCount": 10
    }
  },
  "message": "Persona retrained successfully"
}
```

---

## Messages

### GET /messages/inbox

Get inbox messages. **Requires authentication**.

**Response** (200):
```json
[
  {
    "id": "uuid",
    "from": "investor@vc.com",
    "subject": "Follow up on pitch deck",
    "snippet": "I reviewed your pitch deck...",
    "received": "2h",
    "body": "Full email body here..."
  }
]
```

### POST /messages/:messageId/generate

Generate twin reply for a message. **Requires authentication**.

**Request Body**:
```json
{
  "mode": "hybrid",
  "toneShift": 0,
  "riskTolerance": 50
}
```

**Parameters**:
- `mode`: `"ghost"` | `"auto"` | `"hybrid"`
- `toneShift`: Number from -10 to 10
- `riskTolerance`: Number from 0 to 100

**Response** (200):
```json
{
  "candidates": [
    {
      "label": "Conservative",
      "text": "Thank you for your email...",
      "length_chars": 150,
      "confidence": 85,
      "rationale": "Safe, polite response matching persona tone",
      "persona_rules_applied": ["tone_matching", "phrase_usage"]
    },
    {
      "label": "Normal",
      "text": "Thanks for reaching out...",
      "length_chars": 120,
      "confidence": 90,
      "rationale": "Balanced response with persona characteristics",
      "persona_rules_applied": ["tone_matching", "phrase_usage", "risk_assessment"]
    },
    {
      "label": "Bold",
      "text": "Got your message...",
      "length_chars": 80,
      "confidence": 75,
      "rationale": "Direct response within risk tolerance",
      "persona_rules_applied": ["directness", "brevity"]
    }
  ]
}
```

### POST /messages/:messageId/send

Send a message. **Requires authentication**.

**Request Body**:
```json
{
  "content": "Thank you for your email. I'll review and get back to you."
}
```

**Response** (200):
```json
{
  "message": {
    "id": "uuid",
    "direction": "outbound",
    "from_email": "user@example.com",
    "to_email": "investor@vc.com",
    "subject": "Re: Follow up on pitch deck",
    "body": "Thank you for your email...",
    "status": "sent"
  },
  "success": true
}
```

---

## Activity & Metrics

### GET /activity

Get recent activity. **Requires authentication**.

**Response** (200):
```json
[
  {
    "action": "Persona retrained successfully",
    "timestamp": "2h ago"
  },
  {
    "action": "Generated 3 reply candidates",
    "timestamp": "5h ago"
  }
]
```

### GET /metrics

Get usage metrics. **Requires authentication**.

**Response** (200):
```json
{
  "tokensUsed": 12400,
  "messagesSent": 15,
  "approvalRate": 72.5,
  "confidence": 82.3,
  "responseTime": 1.2
}
```

---

## Error Responses

All endpoints may return these error responses:

**400 Bad Request**:
```json
{
  "error": "Validation error message"
}
```

**401 Unauthorized**:
```json
{
  "error": "Invalid token"
}
```

**404 Not Found**:
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limits

- **Development**: No limits
- **Production**: 100 requests per minute per user

---

## Webhooks (Future)

Gmail webhook integration coming in v2.

---

For more information, see [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md).
