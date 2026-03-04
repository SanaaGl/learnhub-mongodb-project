const express = require("express");
const router = express.Router();
const { connect, ObjectId } = require("../db");

// POST /api/reviews — Laisser un avis 
router.post("/", async (req, res) => {
  try {
    const db = await connect();
    const { userId, courseId, rating, title, comment } = req.body;

    const uid = new ObjectId(userId);
    const cid = new ObjectId(courseId);

    // 1. Vérifier l'inscription au cours
    const enrollment = await db.collection("enrollments").findOne({ userId: uid, courseId: cid });
    if (!enrollment) return res.status(403).json({ error: "Vous devez être inscrit pour laisser un avis" });

    // 2. Vérifier pas de doublon d'avis
    const existing = await db.collection("reviews").findOne({ userId: uid, courseId: cid });
    if (existing) return res.status(409).json({ error: "Vous avez déjà laissé un avis pour ce cours" });

    // 3. Créer la review
    const isVerified = enrollment.status === "completed";
    const newReview = {
      userId: uid, courseId: cid,
      rating: parseInt(rating), title, comment,
      isVerified,
      helpfulCount: 0,
      createdAt: new Date(),
      updatedAt: null
    };
    const result = await db.collection("reviews").insertOne(newReview);

    // 4. Recalculer la moyenne du cours
    const allReviews = await db.collection("reviews").find({ courseId: cid }).toArray();
    const avgRating  = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.collection("courses").updateOne(
      { _id: cid },
      { $set: { "rating.average": Math.round(avgRating * 10) / 10, "rating.count": allReviews.length } }
    );

    res.status(201).json({ message: "Avis publié", reviewId: result.insertedId, newAverage: Math.round(avgRating * 10) / 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews — Lister les avis
router.get("/", async (req, res) => {
  try {
    const db = await connect();
    const { courseId, userId, minRating } = req.query;
    const filter = {};
    if (courseId)  filter.courseId = new ObjectId(courseId);
    if (userId)    filter.userId   = new ObjectId(userId);
    if (minRating) filter.rating   = { $gte: parseInt(minRating) };
    const reviews = await db.collection("reviews").find(filter).sort({ createdAt: -1 }).toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id — Supprimer un avis
router.delete("/:id", async (req, res) => {
  try {
    const db = await connect();
    const result = await db.collection("reviews").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Avis non trouvé" });
    res.json({ message: "Avis supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
