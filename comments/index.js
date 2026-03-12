require('./tracing');
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentSchema = new mongoose.Schema({
  content: String,
  status: String,
  postId: String,
});
const Comment = mongoose.model("Comment", commentSchema);

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://comments-mongo-srv:27017/comments");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
connectDB();

app.get("/posts/:id/comments", async (req, res) => {
  const comments = await Comment.find({ postId: req.params.id });
  res.send(comments);
});

app.post("/posts/:id/comments", async (req, res) => {
  const { content } = req.body;

  const comment = new Comment({
    content,
    status: "pending",
    postId: req.params.id,
  });
  await comment.save();

  await axios.post("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      id: comment._id,
      content,
      postId: req.params.id,
      status: "pending",
    },
  });

  res.status(201).send(comment);
});

app.post("/events", async (req, res) => {
  console.log("Event Received:", req.body.type);

  const { type, data } = req.body;

  if (type === "CommentModerated") {
    const { postId, id, status, content } = data;

    const comment = await Comment.findById(id);
    comment.set({ status });
    await comment.save();

    await axios.post("http://event-bus-srv:4005/events", {
      type: "CommentUpdated",
      data: {
        id,
        status,
        postId,
        content,
      },
    });
  }

  res.send({});
});

app.listen(4001, () => {
  console.log("Listening on 4001");
});