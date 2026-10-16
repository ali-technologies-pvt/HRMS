const { createClient } = require("mongodb");
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;

module.exports = {
  createClient,
  MongoClient,
  uri,
};
