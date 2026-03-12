const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose")

const app = express();
app.use(bodyParser.json());
app.use(cors());

const postSchema = new mongoose.Schema({
  id: String,
  title: String,
  comments: [
    {
      id: String,
      content: String,
      status: String,
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://query-mongo-srv:27017/query");
    console.log("Connected to Query MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
connectDB();

const handleEvent = async (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;

    const post = new Post({ id, title, comments: [] });
    await post.save();  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;

    const post = await Post.findOne({ id: postId });
    if (post) {
      post.comments.push({ id, content, status });
      await post.save();
    }
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;

    const post = await Post.findOne({ id: postId });
    if (post) {
      const comment = post.comments.find((c) => c.id === id);
      if (comment) {
        comment.status = status;
        comment.content = content;
        await post.save();
      }
    }
  }
};

app.get("/posts", async (req, res) => {
  const posts = await Post.find({});
  res.send(posts);
});

app.post("/events", async (req, res) => {
  const { type, data } = req.body;

  await handleEvent(type, data);

  res.send({});
});

app.listen(4002, async () => {
  console.log("Listening on 4002");
  try {
    const res = await axios.get("http://event-bus-srv:4005/events");

    for (let event of res.data) {
      console.log("Processing event:", event.type);

      await handleEvent(event.type, event.data);
    }
  } catch (error) {
    console.log(error.message);
  }
});
