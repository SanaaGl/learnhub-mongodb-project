// routes/courses.js
import { Router } from "express";
const router = Router();
import { connect, ObjectId } from "../db";

// POST /api/courses/bulk — Insérer 3 cours 
router.post("/bulk", async (req, res) => {
  try {
    const db = await connect();
    const courses = req.body.map(c => ({ ...c, createdAt: new Date(), updatedAt: new Date() }));
    const result = await db.collection("courses").insertMany(courses);
    res.status(201).json({ message: `${result.insertedCount} cours créés`, insertedIds: result.insertedIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//POST /api/courses — Créer un seul cours
router.post("/", async (req, res) => {
  try {
    const db = await connect();
    const course = { ...req.body, enrollmentCount: 0, rating: { average: 0, count: 0 }, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection("courses").insertOne(course);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/courses — Catalogue avec filtres, sort, pagination

router.get("/", async (req, res) => {
  try {
    const db = await connect();
    const {
      category, difficulty,
      minPrice, maxPrice, minRating,
      sort = "enrollmentCount", order = "desc",
      page = 1, limit = 10,
      published
    } = req.query;

    // Construire le filtre dynamiquement
    const filter = {};
    if (category)   filter.category   = { $in: category.split(",") };   // $in
    if (difficulty) filter.difficulty = difficulty;
    if (published !== undefined) filter.isPublished = published === "true";
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);   // $gte
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);   // $lte
    }
    if (minRating) filter["rating.average"] = { $gte: parseFloat(minRating) };

    const sortObj = { [sort]: order === "asc" ? 1 : -1 };
    const skip    = (parseInt(page) - 1) * parseInt(limit);

    const courses = await db.collection("courses")
      .find(filter, { projection: { _id: 1, title: 1, price: 1, rating: 1, category: 1, difficulty: 1, enrollmentCount: 1 } })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection("courses").countDocuments(filter);
    res.json({ total, page: parseInt(page), limit: parseInt(limit), courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id — Un cours 
router.get("/:id", async (req, res) => {
  try {
    const db = await connect();
    const course = await db.collection("courses").findOne({ _id: new ObjectId(req.params.id) });
    if (!course) return res.status(404).json({ error: "Cours non trouvé" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//PATCH /api/courses/:id — Modifier un cours
router.patch("/:id", async (req, res) => {
  try {
    const db = await connect();
    const { addTag, removeTag, ...fields } = req.body;
    const update = { $set: { ...fields, updatedAt: new Date() } };
    if (addTag)    update.$push = { tags: addTag };     
    if (removeTag) update.$pull = { tags: removeTag };  
    const result = await db.collection("courses").updateOne(
      { _id: new ObjectId(req.params.id) },
      update
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id 
router.delete("/:id", async (req, res) => {
  try {
    const db = await connect();
    const courseId = new ObjectId(req.params.id);

    // 1. Supprimer le cours
    const delCourse = await db.collection("courses").deleteOne({ _id: courseId });
    if (delCourse.deletedCount === 0) return res.status(404).json({ error: "Cours non trouvé" });

    // 2. Supprimer toutes ses leçons
    const delLessons = await db.collection("lessons").deleteMany({ courseId });

    // 3. Supprimer toutes ses reviews
    const delReviews = await db.collection("reviews").deleteMany({ courseId });

    // 4. Annuler les inscriptions liées ($set status → "cancelled")
    const cancelEnroll = await db.collection("enrollments").updateMany(
      { courseId },
      { $set: { status: "cancelled" } }
    );

    res.json({
      message: "Cours supprimé avec cascade",
      lessonsDeleted: delLessons.deletedCount,
      reviewsDeleted: delReviews.deletedCount,
      enrollmentsCancelled: cancelEnroll.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
