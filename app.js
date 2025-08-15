const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();
const Schema = mongoose.Schema;
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new Schema({
  username: {
    type: String,
  },
});
let User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: {
    type: String,
  },
  description: {
    type: String,
  },
  duration: {
    type: Number,
  },
  date: {
    type: String,
  },
});
let Exercise = mongoose.model("Exercise", exerciseSchema);

absoluteHtmlPath = __dirname + "/views/index.html";

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ optionsSuccessStatus: 200 }));

app.get("/", (req, res) => {
  res.sendFile(absoluteHtmlPath);
});

app.post("/api/users", async (req, res) => {
  const newUser = new User({ username: req.body.username });
  await newUser.save();

  res.json(newUser);
});

app.get("/api/users", async (req, res) => {
  const users = await User.find();

  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

app.post("/api/users/:id/exercises", async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);

  const exerciseDate = date
    ? new Date(date).toDateString()
    : new Date().toDateString();

  const newExercise = new Exercise({
    userId: user._id,
    username: user.username,
    description,
    duration,
    date: exerciseDate,
  });
  await newExercise.save();

  res.json({
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: exerciseDate,
    _id: user._id,
  });
});

app.get("/api/users/:id/exercises", async (req, res) => {
  const user = await User.findById(req.params.id);
  const exercises = await Exercise.find({ userId: req.params.id });

  res.json(exercises);
});

app.get("/api/users/:id/logs", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  const { from, to, limit } = req.query;

  let filter = { userId };

  if (from || to) {
    filter.date = {};
    if (from) {
      filter.date.$gte = new Date(from).toDateString();
    }
    if (to) {
      filter.date.$lte = new Date(to).toDateString();
    }
  }

  let query = Exercise.find(filter).select("-__v -userId");

  // Handle "limit"
  if (limit) {
    query = query.limit(parseInt(limit));
  }

  const logs = await query.exec();

  res.json({
    _id: user._id,
    username: user.username,
    count: logs.length,
    log: logs.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date,
    })),
  });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
