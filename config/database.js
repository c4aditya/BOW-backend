const mongoose = require("mongoose");
require("dotenv").config();

const dbUri = process.env.MONGODB_URI || process.env.DATABASEURL || "mongodb://127.0.0.1:27017/udemy";

const databaseConnection = () => {
    mongoose.connect(dbUri)
    .then(() => {
        console.log("Database is connected successfully to", dbUri.split('@').pop());
    })
    .catch((error) => {
        console.log("Database connection error:", error.message);
    });
};

module.exports = databaseConnection;
