const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const PORT = process.env.PORT;
const app = express();

app.use(cors());
//middleware parses each request into json format
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
});

app.post("/response", async (req, res) => {
  const { prompt } = req.body;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });
    //may need to do just data or just choices to define what we actually want
    console.log(completion.choices[0].message.content);
    res.send(completion.choices[0].message.content);
  } catch (error) {
    console.error("Error generating response:", error);
    res.status(500).send("Error generating response");
  }
});

app.listen(PORT, () => {
  console.log(`server is running at http://localhost:${PORT}`);
});
