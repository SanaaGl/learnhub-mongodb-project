// db.js — Connexion MongoDB
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

let db;

async function connect() {
  if (db) return db;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log(` Connected to MongoDB — database: ${process.env.DB_NAME}`);
  return db;
}

module.exports = { connect, ObjectId };
