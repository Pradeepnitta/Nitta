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
    saveUninitialized: false,
    cookie: process.env.RENDER ? {
      sameSite: "none",
      secure: true
    } : {}
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);

app.get("/api/debug-files", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const targetPath = path.join(__dirname, "..");
  
  function getDirectoryStructure(dir, depth = 0) {
    if (depth > 3) return { name: path.basename(dir), type: "dir", children: [] };
    try {
      const files = fs.readdirSync(dir);
      return files.map(file => {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
          if (file === "node_modules" || file === ".git") {
            return { name: file, type: "dir", omitted: true };
          }
          return {
            name: file,
            type: "dir",
            children: getDirectoryStructure(fullPath, depth + 1)
          };
        } else {
          return { name: file, type: "file", size: stats.size };
        }
      });
    } catch (err) {
      return { error: err.message };
    }
  }

  const structure = getDirectoryStructure(targetPath);
  res.json({
    __dirname,
    distPath,
    distExists: fs.existsSync(distPath),
    structure
  });
});

// Serve frontend static assets when compiled in production
const distPath = path.join(__dirname, "../frontend/vite-project/dist");
if (fs.existsSync(distPath)) {
  console.log("[SERVER INFO] Production static client build directory detected. Mounting assets.");
  app.use(express.static(distPath));
  
  // Custom SPA router fallback (skip any relative API routes so they return standard 404s)
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Local dev mode fallback root
  app.get("/", (_, res) => {
    res.json({ message: "API running" });
  });
}

app.get("/healthz", (_, res) => {
  res.status(200).send("OK");
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