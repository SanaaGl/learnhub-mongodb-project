// queries.mongosh.js
// Exécuter avec : mongosh queries.mongosh.js

db = db.getSiblingDB("learnhub");

print("=== Phase 2 - Requêtes MongoDB - LearnHub ===");
print("Date d'exécution : " + new Date().toISOString());
print("");

//  2.1 CRUD

// 1. INSERT un nouvel utilisateur (étudiant)
db.users.insertOne({
  firstName: "Test",
  lastName: "Student",
  email: "test.student@email.com",
  role: "student",
  profile: {
    bio: "Test utilisateur pour le projet",
    avatar: "https://i.pravatar.cc/150?u=teststudent",
    city: "Casablanca",
    country: "Maroc"
  },
  skills: ["MongoDB", "Node.js"],
  isActive: true,
  totalCoursesEnrolled: 0,
  createdAt: new Date(),
  lastLoginAt: new Date()
});

// 2. INSERT 3 nouveaux cours en une seule opération
db.courses.insertMany([
  {
    title: "Cours 1 - Développement Web Moderne",
    description: "Apprenez HTML, CSS, JS et plus...",
    instructorId: ObjectId("69a5862e16489ce0ed7c2907"),  
    category: "Web",
    difficulty: "beginner",
    price: 29.99,
    tags: ["web", "javascript", "frontend"],
    metadata: { duration: 720, totalLessons: 12, language: "fr" },
    rating: { average: 4.3, count: 42 },
    isPublished: true,
    enrollmentCount: 85,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Cours 2 - Bases de données NoSQL",
    description: "Maîtrisez MongoDB de A à Z",
    instructorId: ObjectId("69a5862e16489ce0ed7c290a"),  
    category: "Database",
    difficulty: "intermediate",
    price: 59.99,
    tags: ["mongodb", "nosql", "database"],
    metadata: { duration: 1080, totalLessons: 16, language: "fr" },
    rating: { average: 4.6, count: 67 },
    isPublished: true,
    enrollmentCount: 134,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Cours 3 - Introduction à l'IA",
    description: "Concepts de base et premiers modèles",
    instructorId: ObjectId("69a5862e16489ce0ed7c290d"),  
    difficulty: "beginner",
    price: 39.99,
    tags: ["ia", "machine-learning", "python"],
    metadata: { duration: 900, totalLessons: 14, language: "fr" },
    rating: { average: 4.4, count: 51 },
    isPublished: true,
    enrollmentCount: 98,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// 3. UPDATE ville — exemple avec un utilisateur existant
db.users.updateOne(
  { email: "test.student@email.com" },   
  { $set: { "profile.city": "Rabat" } }
);

// 4. $inc enrollmentCount 
db.courses.updateOne(
  { _id: ObjectId("69a5862e16489ce0ed7c291b") },  
  { $inc: { enrollmentCount: 1 } }
);

// 5. $push skill 
db.users.updateOne(
  { email: "alice.martin@email.com" },   
  { $push: { skills: "TypeScript" } }
);

// 6. $pull tag 
db.courses.updateOne(
  { _id: ObjectId("69a5862e16489ce0ed7c291c") }, 
  { $pull: { tags: "nosql" } }
);

// 7. Mise à jour multiple (inactifs > 6 mois) 
db.users.updateMany(
  { lastLoginAt: { $lt: new Date("2024-06-01") } },
  { $set: { isActive: false } }
);

// 8. Upsert profil 
db.users.updateOne(
  { email: "alice.martin@email.com" },
  { $setOnInsert: { role: "student" }, $set: { "profile.city": "Paris" } },
  { upsert: true }
);

// 9. DELETE review 
db.reviews.deleteOne({ _id: ObjectId("69a5862e16489ce0ed7c2920") });  

// 10. DELETE cancelled enrollments
db.enrollments.deleteMany({ status: "cancelled" });

//  2.2 Sélection 


// 11. Prix entre 20 et 80
print("11. Cours entre 20€ et 80€");
db.courses.find({ price: { $gte: 20, $lte: 80 } })
  .limit(8)
  .forEach(printjson);

// 12. Catégories Database ou Web
print("\n12. Cours des catégories Database ou Web");
db.courses.find({ category: { $in: ["Database", "Web"] } })
  .limit(8)
  .forEach(printjson);

// 13. Pas advanced
print("\n13. Cours qui ne sont PAS advanced");
db.courses.find({ difficulty: { $ne: "advanced" } })
  .limit(8)
  .forEach(printjson);

// 14. Actifs + étudiants
print("\n14. Utilisateurs actifs ET étudiants");
db.users.find({ isActive: true, role: "student" })
  .limit(6)
  .forEach(printjson);

// 15. Gratuits OU note ≥ 4.5
print("\n15. Cours gratuits OU note ≥ 4.5");
db.courses.find({ $or: [ { price: 0 }, { "rating.average": { $gte: 4.5 } } ] })
  .limit(6)
  .forEach(printjson);

// 16. updatedAt existe et non null
db.reviews.find({ updatedAt: { $exists: true, $ne: null } });

// 17. Ville Paris
print("\n17. Utilisateurs habitant à Paris");
db.users.find({ "profile.city": "Paris" })
  .limit(6)
  .forEach(printjson);

// 18. Publié ET note ≥ 4
print("\n18. Cours publiés ET note ≥ 4 ");
db.courses.find({ $and: [ { isPublished: true }, { "rating.average": { $gte: 4 } } ] })
  .limit(6)
  .forEach(printjson);

// 20. Projection titre + prix seulement
print("\n20. Seulement titre + prix des cours (sans _id)");
db.courses.find({}, { title: 1, price: 1, _id: 0 })
  .limit(10)
  .forEach(printjson);

// 22. Top 5 mieux notés
print("\n22. Top 5 cours les mieux notés");
db.courses.find()
  .sort({ "rating.average": -1 })
  .limit(5)
  .forEach(function(doc) {
    printjson({
      title: doc.title,
      average: doc.rating.average,
      count: doc.rating.count,
      enrollments: doc.enrollmentCount
    });
  });

  // 23. Tous les cours triés par prix croissant
print("\n23. Tous les cours triés par prix croissant");
db.courses.find()
  .sort({ price: 1 })
  .limit(10)
  .forEach(printjson);

  // 24. Page 2 (skip 10, limit 10)
print("\n24. Page 2 des cours (skip 10, limit 10, tri prix croissant)");
db.courses.find()
  .sort({ price: 1 })
  .skip(10)
  .limit(10)
  .forEach(printjson);
// 25. Nombre de cours publiés
print("\n25. Nombre total de cours publiés : " + db.courses.countDocuments({ isPublished: true }));

// 2.3 Requêtes Métier 

// 26. Inscription 
const userId = ObjectId("69a5862e16489ce0ed7c2908");     
const courseId = ObjectId("69a5862e16489ce0ed7c291b");   

const already = db.enrollments.findOne({ userId, courseId });
if (!already) {
  db.enrollments.insertOne({
    userId,
    courseId,
    status: "active",
    progress: { completedLessons: [], percentage: 0, lastAccessedAt: new Date() },
    enrolledAt: new Date()
  });
  db.courses.updateOne({ _id: courseId }, { $inc: { enrollmentCount: 1 } });
  db.users.updateOne({ _id: userId }, { $inc: { totalCoursesEnrolled: 1 } });
}

// 27. Catalogue 
print("\n27. Catalogue : Web, publiés, <70€, note ≥4, tri par popularité, première page");
db.courses.find(
  { category: "Web", isPublished: true, price: { $lt: 70 }, "rating.average": { $gte: 4 } },
  { title: 1, price: 1, "rating.average": 1, enrollmentCount: 1, _id: 0 }
)
  .sort({ enrollmentCount: -1 })
  .limit(10)
  .forEach(printjson);

// 28. Marquer leçon complétée 
db.enrollments.updateOne(
  { _id: ObjectId("69a5862e16489ce0ed7c2925") },          
  {
    $push: { "progress.completedLessons": ObjectId("69a5862e16489ce0ed7c2930") },  
    $set: { "progress.percentage": 75 }
  }
);

// 29. Suppression cascade 
const courseIdToDelete = ObjectId("69a5862e16489ce0ed7c291c"); 
db.courses.deleteOne({ _id: courseIdToDelete });
db.lessons.deleteMany({ courseId: courseIdToDelete });
db.reviews.deleteMany({ courseId: courseIdToDelete });
db.enrollments.updateMany({ courseId: courseIdToDelete }, { $set: { status: "cancelled" } });

// 30. Dashboard utilisateur 
print("\n30. Dashboard utilisateur (exemple pour un utilisateur spécifique)");
const userIdForDashboard = ObjectId("69a5862e16489ce0ed7c2907"); 
const user = db.users.findOne({ _id: userIdForDashboard }, { profile: 1, skills: 1, _id: 0 });
const activeEnrollments = db.enrollments.find({ userId: userIdForDashboard, status: "active" }).toArray();
const userReviews = db.reviews.find({ userId: userIdForDashboard }).sort({ createdAt: -1 }).limit(5).toArray();

printjson({
  userProfileAndSkills: user,
  activeEnrollments: activeEnrollments,
  userReviews: userReviews
});

print("\n=== Fin des requêtes visibles ===");
print("Vérifiez manuellement les modifications (insert/update/delete) avec db.collection.findOne(...)");