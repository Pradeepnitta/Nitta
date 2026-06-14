require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const authRoutes =
  require("./routes/authroutes");

require("./config/passport");

const app = express();

if (process.env.RENDER) {
  app.set("trust proxy", 1);
}

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  if (req.url.includes("/auth/me")) {
    console.log(`[AUTH HEADERS]`, req.headers);
  }
  res.on("finish", () => {
    console.log(`[RESPONSE] ${req.method} ${req.url} -> Status ${res.statusCode}`);
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
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

const { MongoStore } = require("connect-mongo");

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: process.env.RENDER ? {
    sameSite: "none",
    secure: true
  } : {}
};

if (isMongoUri) {
  sessionConfig.store = MongoStore.create({
    mongoUrl: mongoUri,
    ttl: 14 * 24 * 60 * 60 // 14 days
  });
}

app.use(session(sessionConfig));

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
  app.get("/{*splat}", (req, res, next) => {
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

const port = process.env.PORT || 5000;

async function startServer() {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});