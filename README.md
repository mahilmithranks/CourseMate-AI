# AI Academy WhatsApp Chatbot

A WhatsApp chatbot built for KalviumLabs Forge April task. Integrates **Whapi** (WhatsApp API) with a **multi-LLM fallback system** (Gemini → Groq → OpenAI → Rule-Based) to answer student queries about the AI Academy course.

## 🔗 Live Links

| | Link |
|---|---|
| 🚀 **Backend (Render)** | https://coursemate-ai-j4tm.onrender.com |
| 💬 **Try on WhatsApp** | [Click to Chat](https://wa.me/919363978578?text=Start) |
| 📦 **GitHub Repo** | https://github.com/mahilmithranks/CourseMate-AI |

> Send `AI-Academy` in WhatsApp to activate the bot.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **WhatsApp API**: [Whapi Cloud](https://whapi.cloud)
- **LLM (Primary)**: Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`
- **LLM (Fallback 1)**: Groq (`llama3-8b-8192`) via `groq-sdk`
- **LLM (Fallback 2)**: OpenAI (`gpt-4o-mini`) via `openai`
- **LLM (Last Resort)**: Rule-based keyword matching

## Setup

### 1. Clone & Install

```bash
git clone https://github.com/mahilmithranks/CourseMate-AI.git
cd CourseMate-AI
npm install
```

### 2. Configure Environment

Create a `.env` file with the following:

```env
WHAPI_TOKEN=your_whapi_token
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

### 3. Run Locally (with ngrok for webhook testing)

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
# Copy the https URL → paste into Whapi webhook settings
```

### 4. Deploy (Render)

This backend is deployed on **[Render](https://render.com)**.

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo (`mahilmithranks/CourseMate-AI`)
4. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment**: Node
5. Add all environment variables (`WHAPI_TOKEN`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`)
6. Deploy — Render gives you a public HTTPS URL
7. Set that URL as your Whapi webhook: `https://coursemate-ai-j4tm.onrender.com/webhook`

> ⚠️ Free tier on Render **sleeps after 15 minutes** of inactivity. Use [UptimeRobot](https://uptimerobot.com) to ping `https://coursemate-ai-j4tm.onrender.com/webhook` every 10 minutes to keep it awake.

## Usage

1. Open WhatsApp and message your Whapi-connected number
2. Send: `AI-Academy`
3. Bot responds: *"Thank you for reaching out to the AI Assistant! How can I help you today?"*
4. Ask anything about the course!

## LLM Fallback Chain

| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Gemini | gemini-1.5-flash |
| 2 | Groq | llama3-8b-8192 |
| 3 | OpenAI | gpt-4o-mini |
| 4 | Rule-Based | keyword matching |

If a provider fails (rate limit, quota, error), the next one is tried automatically.

## Course Info the Bot Knows

| Module | Units | Access |
|--------|-------|--------|
| Module 1: Introduction to LLM | 10 | Free |
| Module 2: Basics of Prompting | 12 | Free |
| Module 3: Deep Dive into LLM Integration | 15 | ₹499 |
| Module 4: Advanced LLM Concepts & Agentic AI | 17 | ₹499 |

- Payment: https://ai-academy.example.com/pricing
- Completion certificate available after all 4 modules

## Architecture

See [LLD.md](./LLD.md) for full architecture, data flow diagrams, and component breakdown.
