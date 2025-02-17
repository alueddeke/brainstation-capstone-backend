const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const PORT = process.env.PORT || 3000;
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://gist-antonilueddeke.netlify.app",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(bodyParser.json());
bodyParser.json();

const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const MODEL_NAME = "gemini-1.0-pro";

app.post("/response/gemini", async (req, res) => {
  const { prompt } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 350,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const parts = [{ text: prompt }];

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    const response = result.response.text();

    res.send(response);
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send("Error generating response");
  }
});

app.post("/response/gpt", async (req, res) => {
  const { prompt } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content;

    res.send(response);
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send("Error generating response");
  }
});
app.post("/response/perplexity", async (req, res) => {
  const { prompt } = req.body;
  console.log("Received prompt:", prompt);

  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PERPLEXITY_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online", // Updated to correct model name
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    }),
  };

  try {
    console.log("Making request to Perplexity API with options:", {
      ...options,
      headers: { ...options.headers, authorization: "REDACTED" },
    });

    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );

    console.log("Perplexity API response status:", response.status);
    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      throw new Error(
        `Perplexity API error: ${response.status} - ${responseText}`
      );
    }

    const jsonResponse = JSON.parse(responseText);

    if (!jsonResponse.choices || !jsonResponse.choices[0]) {
      throw new Error(
        `Invalid response format: ${JSON.stringify(jsonResponse)}`
      );
    }

    const perplexityResponse = jsonResponse.choices[0].message.content;
    console.log("Successful response:", perplexityResponse);
    res.json(perplexityResponse);
  } catch (error) {
    console.error("Detailed error in Perplexity endpoint:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    res.status(500).json({
      error: "Error fetching response from Perplexity AI",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});
