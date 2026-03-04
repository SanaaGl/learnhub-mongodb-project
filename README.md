LearnHub —  MongoDB

 Structure du Projet
learnhub/
├── seed.mongosh.js          
├── queries.mongosh.js       
└── api/
    ├── .env                 
    ├── package.json
    ├── server.js            
    ├── db.js                
    └── routes/
        ├── users.js         
        ├── courses.js       
        ├── enrollments.js   
        ├── reviews.js       
        └── lessons.js       

 Installation & Lancement
Prérequis

MongoDB installé et lancé (mongod)
Node.js 
mongosh disponible en ligne de commande

Étape 1 — Insérer les données de seed

 mongosh learnhub seed.mongosh.js

Cela crée la base learnhub avec :

20 utilisateurs
15 cours
45 leçons
25 inscriptions
20 reviews

Étape 2 — Exécuter les requêtes Phase 2

 mongosh learnhub queries.mongosh.js

Étape 3 — Lancer l'API

 cd api
 npm install
 npm start          
 npm run dev 

L'API démarre sur http://localhost:3000



Exemples de requêtes (curl / Postman)
Créer un utilisateur
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Curie",
    "email": "marie.curie@test.com",
    "role": "student",
    "profile": { "bio": "Test", "city": "Paris", "country": "France" },
    "skills": ["Python"]
  }'

Catalogue filtré (cours Web, < 70€, triés par popularité)

curl "http://localhost:3000/api/courses?category=Web&maxPrice=70&minRating=4&sort=enrollmentCount&order=desc&page=1&limit=10"

Inscrire un utilisateur

curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{ "userId": "<USER_ID>", "courseId": "<COURSE_ID>", "paymentMethod": "card" }'

Marquer une leçon complétée
curl -X PATCH http://localhost:3000/api/enrollments/<ENROLLMENT_ID>/progress \
  -H "Content-Type: application/json" \
  -d '{ "lessonId": "<LESSON_ID>" }'

Dashboard utilisateur
curl http://localhost:3000/api/users/<USER_ID>/dashboard
Supprimer un cours (cascade)
bashcurl -X DELETE http://localhost:3000/api/courses/<COURSE_ID>

