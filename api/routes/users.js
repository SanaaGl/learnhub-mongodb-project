// routes/users.js
const express = require("express");
const router = express.Router();
const { connect, ObjectId } = require("../db");

//POST /api/users — Créer un utilisateur
router.post("/", async (req, res) => {
  try {
    const db = await connect();
    const user = {
      ...req.body,
      isActive: true,
      totalCoursesEnrolled: 0,
      createdAt: new Date(),
      lastLoginAt: new Date()
    };
    const result = await db.collection("users").insertOne(user);
    res.status(201).json({ message: "Utilisateur créé", insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/users — Lister les utilisateurs
router.get("/", async (req, res) => {
  try {
    const db = await connect();
    const { role, city, active } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (city)   filter["profile.city"] = city;
    if (active) filter.isActive = active === "true";
    const users = await db.collection("users").find(filter, { projection: { profile: 0 } }).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/users/:id — Récupérer un utilisateur (findOne)
router.get("/:id", async (req, res) => {
  try {
    const db = await connect();
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//PATCH /api/users/:id — Modifier ($set / $push / $pull / $inc)
router.patch("/:id", async (req, res) => {
  try {
    const db = await connect();
    const { city, addSkill, removeSkill, incrementCourses } = req.body;
    const update = {};

    if (city)             update.$set  = { "profile.city": city };      
    if (addSkill)         update.$push = { skills: addSkill };           
    if (removeSkill)      update.$pull = { skills: removeSkill };        
    if (incrementCourses) update.$inc  = { totalCoursesEnrolled: 1 }; 

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(req.params.id) },
      update
    );
    res.json({ message: "Utilisateur mis à jour", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//PUT /api/users/:id/profile — Upsert du profil
router.put("/:id/profile", async (req, res) => {
  try {
    const db = await connect();
    let filter;
    try {
      filter = { _id: new ObjectId(req.params.id) };
    } catch {
      filter = { email: req.params.id };
    }
    const result = await db.collection("users").updateOne(
      filter,
      { $set: { profile: req.body, lastLoginAt: new Date() } },
      { upsert: true }   
    );
    res.json({ message: "Profil mis à jour", upserted: !!result.upsertedId, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//GET /api/users/:id/dashboard — Dashboard
router.get("/:id/dashboard", async (req, res) => {
  try {
    const db = await connect();
    const userId = new ObjectId(req.params.id);

    // 1. Récupérer l'utilisateur
    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { "profile.avatar": 0 } }
    );
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // 2. Ses inscriptions actives
    const enrollments = await db.collection("enrollments").find(
      { userId, status: "active" }
    ).toArray();

    // 3. Ses derniers avis
    const reviews = await db.collection("reviews").find(
      { userId }
    ).sort({ createdAt: -1 }).limit(5).toArray();

    // 4. Assembler la réponse
    res.json({ user, activeEnrollments: enrollments, recentReviews: reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
