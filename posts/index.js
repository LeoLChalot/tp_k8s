require('./tracing');
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const postSchema = new mongoose.Schema({
  title: String,
});
const Post = mongoose.model("Post", postSchema);

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://posts-mongo-srv:27017/posts");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
connectDB();

app.get("/posts", async (req, res) => {
  const posts = await Post.find({});
  res.send(posts);
});

app.post('/posts/create', async (req, res) => {
  const { title } = req.body;

  const post = new Post({
    title,
  })
  await post.save();

  await axios.post("http://event-bus-srv:4005/events", {
    type: "PostCreated",
    data: {
      id: post._id,
      title,
    },
  });

  res.status(201).send(post);
});

app.post("/events", (req, res) => {
  console.log("Received Event", req.body.type);

  res.send({});
});

app.listen(4000, () => {
  console.log("Listening on 4000");
});
