// const mongoose = require("mongoose");
// const mongoURI = process.env.MONGODB_URI;
// const dbName = process.env.DB_NAME;

// // Connect to MongoDB Atlas
// mongoose.connect(mongoURI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   dbName: dbName, // Specify the database name
// });

// // Get the default connection
// const db = mongoose.connection;

// // Event handlers for the connection
// db.on("error", console.error.bind(console, "MongoDB connection error:"));
// db.once("open", () => {
//   console.log("Connected to MongoDB Atlas");
//   // You can perform database operations here after successful connection
// });

const mongoose = require("mongoose");

function connectToMongoDB(mongoURI, dbName) {
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: dbName, // Specify the database name
  });

  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "MongoDB connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB Atlas");
    // You can perform database operations here after successful connection
  });
}

module.exports = connectToMongoDB;
