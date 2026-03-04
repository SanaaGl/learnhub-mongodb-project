// routes/lessons.js
const express = require("express");
const router = express.Router();
const { connect, ObjectId } = require("../db");

//  GET /api/lessons — Lister les leçons d'un cours
router.get("/", async (req, res) => {
  try {
    const db = await connect();
    const { courseId, type, free } = req.query;
    const filter = {};
    if (courseId) filter.courseId = new ObjectId(courseId);
    if (type)     filter.type     = type;
    if (free)     filter.isFree   = free === "true";
    const lessons = await db.collection("lessons")
      .find(filter)
      .sort({ order: 1 })
      .toArray();
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons — Créer une leçon 
router.post("/", async (req, res) => {
  try {
    const db = await connect();
    const lesson = { ...req.body, courseId: new ObjectId(req.body.courseId), createdAt: new Date() };
    const result = await db.collection("lessons").insertOne(lesson);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lessons/:id 
router.delete("/:id", async (req, res) => {
  try {
    const db = await connect();
    const result = await db.collection("lessons").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Leçon non trouvée" });
    res.json({ message: "Leçon supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;