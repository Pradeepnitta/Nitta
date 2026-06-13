const jwt = require("jsonwebtoken");
const User = require("../models/user");

const getTokenFromRequest = (req) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return null;
    }

    return header.slice(7);
};

const authenticate = async (req, res, next) => {
    if (req.user) {
        return next();
    }

    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
        const user = await User.findById(payload.id);

        if (!user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        req.user = user;
        return next();
    } catch {
        return res.status(401).json({ message: "Not authenticated" });
    }
};

const requireAdmin = async (req, res, next) => {
    await authenticate(req, res, () => {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ message: "Admin access required" });
        }

        return next();
    });
};

module.exports = {
    authenticate,
    requireAdmin
};