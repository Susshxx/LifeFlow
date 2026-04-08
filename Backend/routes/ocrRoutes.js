const express = require("express");
const router = express.Router();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// POST /api/ocr/extract-name
// Body: { base64: string, mimeType: string }
// Returns: { name: string }
router.post("/extract-name", async (req, res) => {
    try {
        const { base64, mimeType } = req.body;

        if (!base64 || !mimeType) {
            return res.status(400).json({ error: "base64 and mimeType are required." });
        }

        if (!ANTHROPIC_API_KEY) {
            return res.status(500).json({ error: "Anthropic API key is not configured on the server." });
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 256,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: mimeType,
                                    data: base64,
                                },
                            },
                            {
                                type: "text",
                                text: `This is a Nepali citizenship certificate or national ID card.
Extract ONLY the full name of the document holder exactly as it is printed.
Reply with just the name and absolutely nothing else — no labels, no punctuation, no explanation.
If you cannot clearly read a name, reply with exactly: UNREADABLE`,
                            },
                        ],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            console.error("Anthropic API error:", body);
            return res.status(502).json({
                error: body?.error?.message ?? `Anthropic API error ${response.status}`,
            });
        }

        const data = await response.json();
        const name = data.content?.[0]?.text?.trim() ?? "UNREADABLE";

        return res.json({ name });
    } catch (err) {
        console.error("OCR extract-name error:", err);
        return res.status(500).json({ error: "Failed to process document. Please try again." });
    }
});

module.exports = router;