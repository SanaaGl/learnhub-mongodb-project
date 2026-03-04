// server.js  LearnHub API REST
require("dotenv").config();
const express = require("express");
const { connect } = require("./db");

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

app.use(cors({
  origin: 'http://127.0.0.1:5500',                  
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//Import routes 
const usersRouter       = require("./routes/users");
const coursesRouter     = require("./routes/courses");
const lessonsRouter     = require("./routes/lessons");
const enrollmentsRouter = require("./routes/enrollments");
const reviewsRouter     = require("./routes/reviews");

app.use("/api/users",       usersRouter);
app.use("/api/courses",     coursesRouter);
app.use("/api/lessons",     lessonsRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/reviews",     reviewsRouter);

//Health check 
app.get("/", (req, res) => res.json({ message: "LearnHub API is running!" }));

//Start server after DB connection
const PORT = process.env.PORT || 3000;
connect().then(() => {
  app.listen(PORT, () => console.log(` Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
});
