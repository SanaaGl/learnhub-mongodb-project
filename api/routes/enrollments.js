const express = require("express");
const router = express.Router();
const { connect, ObjectId } = require("../db");

//POST /api/enrollments — Inscrire un utilisateur 
router.post("/", async (req, res) => {
  try {
    const db = await connect();
    const { userId, courseId, paymentMethod = "card" } = req.body;

    const uid = new ObjectId(userId);
    const cid = new ObjectId(courseId);

    // 1. Vérifier que l'utilisateur existe
    const user = await db.collection("users").findOne({ _id: uid });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // 2. Vérifier que le cours existe et est publié
    const course = await db.collection("courses").findOne({ _id: cid, isPublished: true });
    if (!course) return res.status(404).json({ error: "Cours non trouvé ou non publié" });

    // 3. Vérifier pas de double inscription
    const existing = await db.collection("enrollments").findOne({ userId: uid, courseId: cid });
    if (existing) return res.status(409).json({ error: "Utilisateur déjà inscrit à ce cours" });

    // 4. Créer l'inscription
    const enrollment = {
      userId: uid,
      courseId: cid,
      status: "active",
      progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() },
      payment: { amount: course.price, method: paymentMethod, paidAt: new Date() },
      enrolledAt: new Date(),
      completedAt: null
    };
    const result = await db.collection("enrollments").insertOne(enrollment);

    // 5. Incrémenter enrollmentCount du cours ($inc)
    await db.collection("courses").updateOne({ _id: cid }, { $inc: { enrollmentCount: 1 } });

    // 6. Incrémenter totalCoursesEnrolled de l'utilisateur ($inc)
    await db.collection("users").updateOne({ _id: uid }, { $inc: { totalCoursesEnrolled: 1 } });

    res.status(201).json({ message: "Inscription réussie", enrollmentId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/enrollments — Lister les inscriptions
router.get("/", async (req, res) => {
  try {
    const db = await connect();
    const { userId, courseId, status } = req.query;
    const filter = {};
    if (userId)   filter.userId   = new ObjectId(userId);
    if (courseId) filter.courseId = new ObjectId(courseId);
    if (status)   filter.status   = status;
    const enrollments = await db.collection("enrollments").find(filter).toArray();
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/enrollments/:id/progress — Marquer leçon complétée
router.patch("/:id/progress", async (req, res) => {
  try {
    const db = await connect();
    const { lessonId } = req.body;
    const enrollmentId = new ObjectId(req.params.id);

    // 1. Récupérer l'inscription
    const enrollment = await db.collection("enrollments").findOne({ _id: enrollmentId });
    if (!enrollment) return res.status(404).json({ error: "Inscription non trouvée" });

    // 2. Vérifier si leçon déjà complétée
    const lessonObjId = new ObjectId(lessonId);
    const alreadyDone = enrollment.progress.completedLessons
      .some(id => id.toString() === lessonObjId.toString());

    if (alreadyDone) return res.status(409).json({ error: "Leçon déjà marquée complétée" });

    // 3. $push la leçon
    await db.collection("enrollments").updateOne(
      { _id: enrollmentId },
      { $push: { "progress.completedLessons": lessonObjId } }
    );

    // 4. Recalculer le pourcentage
    const course = await db.collection("courses").findOne({ _id: enrollment.courseId });
    const totalLessons = course?.metadata?.totalLessons || 1;
    const newCompleted = enrollment.progress.completedLessons.length + 1;
    const newPct = Math.min(Math.round((newCompleted / totalLessons) * 100), 100);

    const updatePayload = {
      $set: {
        "progress.percentage": newPct,
        "progress.lastAccessedAt": new Date()
      }
    };

    // 5. Si 100% → status "completed"
    if (newPct === 100) {
      updatePayload.$set.status = "completed";
      updatePayload.$set.completedAt = new Date();
    }

    await db.collection("enrollments").updateOne({ _id: enrollmentId }, updatePayload);
    res.json({ message: "Progression mise à jour", percentage: newPct, completed: newPct === 100 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/enrollments/:id — Supprimer une inscription
router.delete("/:id", async (req, res) => {
  try {
    const db = await connect();
    const result = await db.collection("enrollments").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Inscription non trouvée" });
    res.json({ message: "Inscription supprimée" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;