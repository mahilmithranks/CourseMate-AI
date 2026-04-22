# LLD — AI Academy WhatsApp Chatbot

## 1. System Overview

A webhook-driven WhatsApp chatbot that uses the Whapi Cloud API to receive and send messages,
and a **multi-LLM fallback system** (Gemini → Groq → OpenAI → Rule-Based) to generate
intelligent, context-aware responses about the AI Academy course.

---

## 2. Architecture Diagram

```text
User (WhatsApp)
      │
      │ sends message
      ▼
  ┌─────────┐          ┌────────────────────────────────────────────┐
  │  Whapi  │──webhook─▶         Express Server (Node.js)           │
  │  Cloud  │◀─send────│                                            │
  └─────────┘          │  ┌─────────────────────────────────────┐   │
                       │  │     LLM Fallback Chain               │   │
                       │  │  1. Gemini (gemini-1.5-flash)        │   │
                       │  │  2. Groq   (llama3-8b-8192)          │   │
                       │  │  3. OpenAI (gpt-4o-mini)             │   │
                       │  │  4. Rule-Based (keyword matching)    │   │
                       │  └─────────────────────────────────────┘   │
                       └────────────────────────────────────────────┘
```

---

## 3. Components

### 3.1 Express Webhook Server
- **Route**: `POST /webhook`
- **Route**: `GET /webhook` → returns `"Webhook is live 🚀"` (health check)
- Receives message payloads from Whapi
- Responds with `200 OK` at the end of processing
- Filters out: outgoing messages (`from_me: true`), non-text messages

### 3.2 Entry Point Logic
- User sends the keyword `"AI-Academy"` to activate the bot
- Bot responds: *"Thank you for reaching out to the AI Assistant! How can I help you today?"*
- All subsequent messages are forwarded to the LLM fallback chain

### 3.3 LLM Fallback Chain

| Priority | Provider | Model | SDK |
|----------|----------|-------|-----|
| 1 (Primary) | **Gemini** | `gemini-1.5-flash` | `@google/generative-ai` |
| 2 (Fallback 1) | **Groq** | `llama3-8b-8192` | `groq-sdk` |
| 3 (Fallback 2) | **OpenAI** | `gpt-4o-mini` | `openai` |
| 4 (Last Resort) | **Rule-Based** | Keyword matching | Built-in |

Each provider is tried in sequence. If one fails (rate limit, quota, network error), the next is tried automatically. The rule-based fallback guarantees the bot always gives a response.

### 3.4 Course Context (Direct Injection)
- Full course details are injected directly into each LLM prompt (no RAG needed)
- Covers: module names, free vs paid access, pricing (₹499), and payment link
- LLMs are instructed not to invent information outside this context

### 3.5 Rule-Based Fallback
Keyword triggers handled when all LLMs fail:

| Keyword | Response |
|---------|----------|
| `price` | ₹499 + payment link |
| `free` | Modules 1 & 2 are free |
| `certificate` | Certificate after all 4 modules |
| `module` | Full module list |
| `enroll` / `enrol` | Payment link |
| *(anything else)* | Retry later message |

### 3.6 Whapi Message Sender
- Calls `POST https://gate.whapi.cloud/messages/text`
- Uses Bearer token auth via `WHAPI_TOKEN`
- Errors are caught and logged without crashing the server

---

## 4. Message Flow

```
1. User sends "AI-Academy" on WhatsApp
2. Whapi delivers webhook to POST /webhook
3. Bot detects trigger → sends welcome message

4. User asks a follow-up question
5. Webhook fires again
6. Server tries Gemini → if fails → Groq → if fails → OpenAI → if fails → Rule-Based
7. Reply is sent directly back to user via Whapi
```

---

## 5. Data Flow Diagram

```
Incoming Webhook Payload (Whapi)
        │
        ▼
   Parse messages[0]
        │
   ┌────┴──────────────────────┐
   │  from_me? or non-text?    │──YES──▶ return 200 (ignore)
   └────┬──────────────────────┘
        │ NO
        ▼
   text == "AI-Academy"?
   ├── YES → send welcome message
   └── NO
        │
        ▼
   Try Gemini API
   ├── SUCCESS → send reply
   └── FAIL
        │
        ▼
   Try Groq API
   ├── SUCCESS → send reply
   └── FAIL
        │
        ▼
   Try OpenAI API
   ├── SUCCESS → send reply
   └── FAIL
        │
        ▼
   Rule-Based keyword match → send reply
        │
        ▼
   POST /messages/text → Whapi → User
```

---

## 6. How the Bot Avoids Getting Banned

### 6.1 User-Initiated Conversations Only
- The bot never sends the first message
- It only replies after the user sends `"AI-Academy"` (opt-in model)
- Matches Whapi best practices for session-based messaging

### 6.2 No Bulk Messaging
- No broadcast lists, no mass notifications
- Each conversation is strictly one-to-one and user-triggered

### 6.3 Webhook Acknowledgment
- The server responds `200 OK` to Whapi to prevent duplicate webhook retries

### 6.4 Single Test Number Policy
- During development, the bot is only activated from one known number

---

## 7. Environment Variables

| Variable | Description |
|----------|-------------|
| `WHAPI_TOKEN` | Whapi Bearer token (from dashboard) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq API key (free tier, fast) |
| `OPENAI_API_KEY` | OpenAI API key (fallback) |
| `PORT` | Server port (default: 3000) |

---

## 8. Deployment Notes

- Host on **Railway**, **Render**, or **Fly.io** for a public HTTPS URL
- Register the webhook URL in the Whapi dashboard: `https://your-domain.com/webhook`
- Ensure HTTPS — Whapi requires a valid SSL certificate on the webhook endpoint

---

## 9. Limitations & Future Improvements

| Limitation | Future Fix |
|---|---|
| No conversation memory | Add session store (Redis/in-memory Map) |
| No media message handling | Add image/document parsing |
| Stateless per-message context | Sliding window conversation history |
| Rule-based fallback is keyword-only | Expand with semantic matching |
| Single server | Horizontal scaling with Redis-backed queue |
