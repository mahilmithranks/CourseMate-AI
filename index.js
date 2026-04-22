const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Groq
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// OpenAI
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Token
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;

// GEMINI (Primary)
async function generateGeminiReply(userMessage) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a helpful AI Academy assistant.

Course Info:
- Module 1 & 2: Free
- Module 3 & 4: Paid (₹499 total)
- Certificate after completion
- Payment: https://ai-academy.example.com/pricing

User: ${userMessage}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text();
}


// GROQ (Fallback 1)
async function generateGroqReply(userMessage) {
    const response = await groq.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
            {
                role: "system",
                content: `
You are an AI Academy assistant.

- Module 1 & 2 are free
- Full course costs ₹499
- Payment: https://ai-academy.example.com/pricing
`
            },
            {
                role: "user",
                content: userMessage
            }
        ]
    });

    return response.choices[0].message.content;
}


//  OPENAI (Fallback 2)
async function generateOpenAIReply(userMessage) {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `
You are an AI Academy assistant.

- Module 1 & 2 are free
- Full course costs ₹499
- Payment: https://ai-academy.example.com/pricing
`
            },
            {
                role: "user",
                content: userMessage
            }
        ]
    });

    return response.choices[0].message.content;
}

// 🌐 WEBHOOK

app.get('/webhook', (req, res) => {
    res.send("Webhook is live 🚀");
});

app.post('/webhook', async (req, res) => {
    try {
        console.log("🔥 Incoming:", JSON.stringify(req.body, null, 2));

        const msgObj = req.body?.messages?.[0];

        // ❗ Ignore own messages
        if (msgObj?.from_me) return res.sendStatus(200);

        const message = msgObj?.text?.body;
        const from = msgObj?.from;

        if (!message) return res.sendStatus(200);

        let reply;

        // 🚀 ENTRY MESSAGE
        if (message === "AI-Academy") {
            reply = "Thank you for reaching out to the AI Assistant! How can I help you today?";
        } else {
            // 🧠 1. GEMINI
            try {
                reply = await generateGeminiReply(message);

            } catch (err1) {
                console.log("⚠️ Gemini failed → Groq");

                // ⚡ 2. GROQ

                try {
                    reply = await generateGroqReply(message);

                } catch (err2) {
                    console.log("⚠️ Groq failed → OpenAI");
                    // 🤖 3. OPENAI
                    try {
                        reply = await generateOpenAIReply(message);

                    } catch (err3) {
                        console.log("⚠️ All AI failed → Rule fallback");

                        // 🛟 4. RULE-BASED
                        const msg = message.toLowerCase();

                        if (msg.includes("price")) {
                            reply = "The full course costs ₹499. Enroll here: https://ai-academy.example.com/pricing";
                        } else if (msg.includes("free")) {
                            reply = "Module 1 and Module 2 are free.";
                        } else if (msg.includes("certificate")) {
                            reply = "You will receive a certificate after completing all modules.";
                        } else if (msg.includes("module")) {
                            reply = `The course includes 4 modules:
                            1. Introduction to LLM (10 units)
                            2. Basics of Prompting (12 units)
                            3. Deep Dive into LLM Integration (15 units)
                            4. Advanced LLM Concepts and Agentic AI (17 units)`;
                        } else if (msg.includes("enroll") || msg.includes("enrol")) {
                            reply = "You can enroll by paying ₹499 here: https://ai-academy.example.com/pricing";
                        } else {
                            reply = "Sorry bro 😅 all systems are busy. Please try again later.";
                        }
                    }
                }
            }
        }

        // MSG
        if (from && reply) {
            await axios.post(
                "https://gate.whapi.cloud/messages/text",
                {
                    to: from,
                    body: reply
                },
                {
                    headers: {
                        Authorization: `Bearer ${WHAPI_TOKEN}`
                    }
                }
            );
        }

        res.sendStatus(200);

    } catch (error) {
        console.error("❌ Error:", error.message);
        res.sendStatus(200);
    }
});

// SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
});