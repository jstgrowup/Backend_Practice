const express = require("express");
const app = express();
require("dotenv").config();
let PORT = process.env.PORT || 3000;
const cors = require("cors");
app.use(cors());
app.use(express.static("dist"));
app.get("/", (req, res) => {
  res.send("hello world");
});

app.get("/api/jokes", (req, res) => {
  const jokes = [
    {
      id: 1,
      question: "Why did the React developer go broke?",
      answer: "Because he couldn't find his state!",
    },
    {
      id: 2,
      question: "What's a React developer's favorite game?",
      answer: "Hide and setState!",
    },
    {
      id: 3,
      question: "How do you comfort a JavaScript bug?",
      answer: "You console it!",
    },
    {
      id: 4,
      question: "Why do programmers prefer React to relationships?",
      answer:
        "Because with React, you never have to worry about unhandled promises!",
    },
    {
      id: 5,
      question: "Why did the component go to therapy?",
      answer: "It had too many issues!",
    },
    {
      id: 6,
      question: "How do you comfort a sad API?",
      answer: "You give it some REST!",
    },
    {
      id: 7,
      question: "Why did the HTML element break up with the CSS style?",
      answer: "It found someone with better class!",
    },
    {
      id: 8,
      question: "What's a web developer's favorite tea?",
      answer: "HTML!",
    },
    {
      id: 9,
      question: "Why did the programmer quit his job?",
      answer: "He didn't get arrays!",
    },
    {
      id: 10,
      question: "How do you comfort a JavaScript bug?",
      answer: "You console it!",
    },
  ];
  res.send(jokes);
});
app.listen(PORT, () => {
  console.log(`app is listening at ${PORT} `);
});
