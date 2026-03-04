// seed.mongosh.js
db = db.getSiblingDB("learnhub");
db.dropDatabase(); 

// USERS 
const users = [];
const firstNames = ["Alice","Bob","Charlie","Dana","Eve","Frank","Grace","Henry","Isabelle","Jack","Kate","Louis","Marie","Nicolas","Olivia","Paul","Quentin","Rachel","Samuel","Tina"];
const lastNames = ["Martin","Dubois","Lefevre","Moreau","Petit","Bernard","Leroy","Rousseau","Fournier","Girard","Blanc","Vincent","Simon","Laurent","Dupont","Morin","Gauthier","Boyer","Lemaire","Marchand"];

for (let i = 0; i < 20; i++) {
  users.push({
    firstName: firstNames[i],
    lastName: lastNames[i % lastNames.length],
    email: `${firstNames[i].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@email.com`,
    role: i % 3 === 0 ? "instructor" : "student",   
    profile: {
      bio: `Passionné${i % 2 === 0 ? "e" : ""} de développement`,
      avatar: `https://i.pravatar.cc/150?u=${i}`,
      city: ["Paris","Lyon","Marseille","Bordeaux","Toulouse","Nice","Lille"][i % 7],
      country: "France"
    },
    skills: ["JavaScript", "Python", "MongoDB", "React", "Node.js"].slice(0, 2 + i % 4),
    isActive: true,
    totalCoursesEnrolled: Math.floor(Math.random() * 6),
    createdAt: new Date(2024, Math.floor(Math.random()*12), 1),
    lastLoginAt: new Date(2024, 11, Math.floor(Math.random()*28) + 1)
  });
}

const userResult = db.users.insertMany(users);
const userIds = Object.values(userResult.insertedIds);

// COURSES
const instructors = userIds.filter((_, i) => i % 3 === 0); 

const courses = [];
const categories = ["Database","Web","Mobile","DevOps","AI"];
const titles = ["MongoDB pour Débutants","React Avancé","Docker & Kubernetes","Python pour l'IA","Flutter Mobile","Next.js 15","AWS Cloud","GraphQL Mastery","TypeScript Pro","Machine Learning","PostgreSQL","Cybersecurity","DevOps CI/CD","Tailwind Masterclass","Go Lang"];

for (let i = 0; i < 15; i++) {
  courses.push({
    title: titles[i],
    description: `Le meilleur cours pour maîtriser ${titles[i]}`,
    instructorId: instructors[i % instructors.length],
    category: categories[i % categories.length],
    difficulty: ["beginner","intermediate","advanced"][i % 3],
    price: (19.99 + Math.random() * 80).toFixed(2) * 1,
    tags: ["mongodb","nosql","fullstack","cloud"].slice(0, 3),
    metadata: {
      duration: 600 + Math.floor(Math.random() * 1800),
      totalLessons: 8 + Math.floor(Math.random() * 15),
      language: "fr"
    },
    rating: { average: (3.5 + Math.random() * 1.5).toFixed(1) * 1, count: 10 + Math.floor(Math.random() * 100) },
    isPublished: true,
    enrollmentCount: 50 + Math.floor(Math.random() * 300),
    createdAt: new Date(2024, 2 + i % 9, 1),
    updatedAt: new Date()
  });
}

const courseResult = db.courses.insertMany(courses);
const courseIds = Object.values(courseResult.insertedIds);

//  LESSONS 
const lessons = [];
for (let c = 0; c < courseIds.length; c++) {
  for (let l = 1; l <= 3; l++) {   
    lessons.push({
      courseId: courseIds[c],
      title: `Leçon ${l} : Introduction au module`,
      content: "Contenu détaillé de la leçon...",
      type: ["video","text","quiz"][l % 3],
      order: l,
      duration: 30 + Math.floor(Math.random() * 60),
      resources: [
        { name: "Slides PDF", url: "https://example.com/slides.pdf" },
        { name: "Code source", url: "https://github.com/..." }
      ],
      isFree: l === 1,
      createdAt: new Date()
    });
  }
}
db.lessons.insertMany(lessons);

// ENROLLMENTS 
const enrollments = [];
for (let i = 0; i < 25; i++) {
  enrollments.push({
    userId: userIds[i % userIds.length],
    courseId: courseIds[i % courseIds.length],
    status: ["active","completed","paused","cancelled"][i % 4],
    progress: {
      completedLessons: [],
      percentage: Math.floor(Math.random() * 101),
      lastAccessedAt: new Date()
    },
    payment: {
      amount: courses[i % courses.length].price,
      method: "card",
      paidAt: new Date(2024, 5, 15)
    },
    enrolledAt: new Date(2024, 5, 15),
    completedAt: i % 5 === 0 ? new Date() : null
  });
}
db.enrollments.insertMany(enrollments);

// REVIEWS 
const reviews = [];
for (let i = 0; i < 20; i++) {
  reviews.push({
    userId: userIds[i % userIds.length],
    courseId: courseIds[i % courseIds.length],
    rating: 4 + Math.floor(Math.random() * 2),
    title: "Excellent cours !",
    comment: "Très bien expliqué, les exercices sont super.",
    isVerified: true,
    helpfulCount: Math.floor(Math.random() * 30),
    createdAt: new Date(2024, 7, 20),
    updatedAt: null
  });
}
db.reviews.insertMany(reviews);

print(" Seed terminé ! 20 users, 15 courses, 45 lessons, 25 enrollments, 20 reviews");