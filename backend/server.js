require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");
const path = require("path");
const selfsigned = require("selfsigned");

const authRoutes =
  require("./routes/authroutes");

require("./config/passport");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || "https://localhost:5173",
  credentials: true
}));

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const isMongoUri = typeof mongoUri === "string" && /^mongodb(\+srv)?:\/\//i.test(mongoUri);

if (isMongoUri) {
  mongoose.connect(mongoUri)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.error("MongoDB connection error", error));
} else {
  console.warn("MONGO_URI is missing or invalid; auth requests will fail until MongoDB is configured.");
}

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);

app.get("/", (_, res) => {
  res.json({ message: "API running" });
});

// Configure and start HTTPS local server
const keyPath = path.join(__dirname, "key.pem");
const certPath = path.join(__dirname, "cert.pem");

const port = process.env.PORT || 5000;
const isRender = Boolean(process.env.RENDER);

async function startServer() {
  if (isRender) {
    // Render production environment: run plain HTTP server (Render's proxy handles SSL)
    app.listen(port, () => {
      console.log(`Server running in production on port ${port}`);
    });
  } else {
    // Local development: run HTTPS server using self-signed certificates
    let key, cert;
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      key = fs.readFileSync(keyPath);
      cert = fs.readFileSync(certPath);
    } else {
      console.log("Generating self-signed SSL certificates for localhost HTTPS...");
      const attrs = [{ name: "commonName", value: "localhost" }];
      const pems = await selfsigned.generate(attrs, { days: 365 });
      
      fs.writeFileSync(keyPath, pems.private);
      fs.writeFileSync(certPath, pems.cert);
      key = pems.private;
      cert = pems.cert;
    }

    const server = https.createServer({ key, cert }, app);

    server.listen(port, () => {
      console.log(`Server running over HTTPS on port ${port}`);
    });
  }
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});