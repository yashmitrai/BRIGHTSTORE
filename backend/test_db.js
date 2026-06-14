const dotenv = require('dotenv');
dotenv.config();
console.log("DB URI is:", process.env.MONGODB_URI);
const mongoose = require('mongoose');
console.log("Connecting to MongoDB...");
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brightstore')
  .then((conn) => {
    console.log("Connected successfully to host:", conn.connection.host);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to connect:", err);
    process.exit(1);
  });
