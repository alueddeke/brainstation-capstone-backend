const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const { Configuration, OpenAiApi } = require("openai");

const app = express();

app.use(cors());
//middleware parses each request into json format
app.use(bodyParser.json());

const configuration = new Configuration({
  apikey: process.env.GPT_KEY,
});

const openai = new OpenAiApi(configuration);

app.post('/response' async (req, res) => {
    const {prompt } = req.body
    const complettion = await openai.chat.completions.create({
        messages: [{role: "system", content: prompt}],
        model="gpt-3.5-turbo",
        max_tokens: 300,
    })
    //may need to do just data or just choices to define what we actually want
    res.send(completion.data.choices[0].content)

})
