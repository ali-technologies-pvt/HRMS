const { createClient } = require("mongodb");
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

module.exports = {
  createClient,
  MongoClient,
};
