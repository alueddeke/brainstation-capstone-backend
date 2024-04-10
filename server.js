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

const PORT = process.env.PORT;
const app = express();

app.use(cors());
//middleware parses each request into json format
app.use(bodyParser.json());

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
      maxOutputTokens: 500,
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
    console.log("geminii");
    console.log("this was a gemini response", response);
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
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    //may need to do just data or just choices to define what we actually want
    const response = completion.choices[0].message.content;
    console.log("gpt");
    console.log("this was a gpt response", response);
    res.send(response);
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send("Error generating response");
  }
});

app.post("/response/perplexity", async (req, res) => {
  const { prompt } = req.body;

  // Define your options for the fetch request
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.PERPLEXITY_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar-small-online",
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: prompt },
      ],
    }),
  };

  try {
    const response = await fetch(
      "https://api.perplexity.ai/chat/completions",
      options
    );

    const jsonResponse = await response.json();

    res.json(jsonResponse);
  } catch (error) {
    console.error("Error fetching response from Perplexity AI:", error);
    res
      .status(500)
      .json({ error: "Error fetching response from Perplexity AI" });
  }
});

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});
