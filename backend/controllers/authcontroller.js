const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const transporter = require("../config/mailer");

const createOtp = () => String(crypto.randomInt(100000, 1000000));

const getToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );

const normalizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isVerified: user.isVerified,
  isEmailVerified: user.isEmailVerified
});

const sendOtpMessages = async ({ email, emailOtp, verifyLink }) => {
  const mailUser = process.env.EMAIL_USER;
  const mailPass = process.env.EMAIL_PASS;

  console.log(`\n==================================================`);
  console.log(`[OTP DEBUG] Generated OTP for Verification:`);
  console.log(`- Target Email: ${email}`);
  console.log(`- Email OTP:    ${emailOtp}`);
  console.log(`- Verification Link: ${verifyLink}`);
  console.log(`==================================================\n`);

  if (mailUser && mailUser !== "yourgmail@gmail.com" && mailPass && mailPass !== "gmail_app_password") {
    try {
      await transporter.sendMail({
        from: mailUser,
        to: email,
        subject: "Verify your account",
        html: `
          <h2>Account verification</h2>
          <p>Your email OTP is <strong>${emailOtp}</strong>.</p>
          <p>You can also verify your email with this link:</p>
          <p><a href="${verifyLink}">Verify email</a></p>
        `
      });
      console.log(`[OTP SUCCESS] Email sent to ${email}`);
    } catch (err) {
      console.error(`[OTP ERROR] Failed to send email to ${email}:`, err.message);
    }
  } else {
    console.log(`[OTP INFO] Email sending skipped (using placeholder or unconfigured email credentials).`);
  }
};

exports.signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user"
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role"
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (!existingUser.password) {
        // User registered with Google first and has no password.
        // Let them define a manual password and link it.
        const hashedPassword = await bcrypt.hash(password, 10);
        const token = crypto.randomBytes(32).toString("hex");
        const emailOtp = createOtp();

        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.role = role;
        existingUser.verificationToken = token;
        existingUser.emailOtp = emailOtp;
        existingUser.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        existingUser.isEmailVerified = false;
        existingUser.isVerified = false;

        await existingUser.save();

        const verifyLink = `https://localhost:5000/api/auth/verify/${token}`;

        await sendOtpMessages({
          email: existingUser.email,
          emailOtp,
          verifyLink
        });

        return res.status(200).json({
          message: "Account sync initiated. Verify your email to establish a password.",
          user: normalizeUser(existingUser),
          verificationPreview: process.env.NODE_ENV !== "production"
            ? { emailOtp }
            : undefined
        });
      }

      return res.status(409).json({
        message: "An account already exists with this email address"
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const token =
      crypto.randomBytes(32).toString("hex");

    const emailOtp = createOtp();

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      verificationToken: token,
      emailOtp,
      emailOtpExpiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    const verifyLink =
      `https://localhost:5000/api/auth/verify/${token}`;

    await sendOtpMessages({
      email: user.email,
      emailOtp,
      verifyLink
    });

    res.status(201).json({
      message: "Signup successful. Verify your email to continue.",
      user: normalizeUser(user),
      verificationPreview: process.env.NODE_ENV !== "production"
        ? { emailOtp }
        : undefined
    });

  } catch (err) {
    res.status(500).json(err);
  }
};

exports.signin = async (req, res) => {
  try {
    const { identifier, password, role = "user" } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedIdentifier = identifier.toLowerCase();

    const user = await User.findOne({
      role,
      email: normalizedIdentifier
    });

    if (!user) {
      return res.status(404).json({
        message: "Account not found for the selected role"
      });
    }

    if (!user.password) {
      // User registered with Google but has no password set.
      // Take the password they entered and set it as their password.
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.isEmailVerified = true;
      user.isVerified = true;
      await user.save();
      console.log(`[AUTH SYNC] Password established for Google OAuth user: ${user.email}`);
    } else {
      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before signing in",
        requiresVerification: true,
        user: normalizeUser(user)
      });
    }

    user.isVerified = true;
    await user.save();

    return res.json({
      message: "Signin successful",
      token: getToken(user),
      user: normalizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to sign in", error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const {
      email,
      emailOtp
    } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    const now = new Date();

    if (!emailOtp) {
      return res.status(400).json({
        message: "Email OTP is required"
      });
    }

    if (!user.emailOtp || user.emailOtp !== emailOtp || !user.emailOtpExpiresAt || user.emailOtpExpiresAt < now) {
      return res.status(400).json({
        message: "Invalid or expired email OTP"
      });
    }

    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiresAt = null;
    user.isVerified = true;
    user.verificationToken = null;

    await user.save();

    return res.json({
      message: "Verification successful",
      token: getToken(user),
      user: normalizeUser(user)
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to verify OTP", error: err.message });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    const emailOtp = createOtp();
    const verificationToken = crypto.randomBytes(32).toString("hex");

    user.emailOtp = emailOtp;
    user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.verificationToken = verificationToken;

    await user.save();

    await sendOtpMessages({
      email: user.email,
      emailOtp,
      verifyLink: `https://localhost:5000/api/auth/verify/${verificationToken}`
    });

    return res.json({
      message: "New OTP code sent",
      verificationPreview: process.env.NODE_ENV !== "production"
        ? { emailOtp }
        : undefined
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to resend OTP", error: err.message });
  }
};

exports.currentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  return res.json({
    user: normalizeUser(req.user)
  });
};

exports.adminOverview = async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const [totalUsers, verifiedUsers, pendingUsers, adminUsers, recentUsers] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isVerified: false }),
    User.countDocuments({ role: "admin" }),
    User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email phone role isVerified createdAt")
  ]);

  return res.json({
    overview: {
      totalUsers,
      verifiedUsers,
      pendingUsers,
      adminUsers
    },
    recentUsers: recentUsers.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }))
  });
};

exports.logout = async (req, res) => {
  if (typeof req.logout !== "function") {
    return res.status(500).json({ message: "Logout is unavailable" });
  }

  req.logout((error) => {
    if (error) {
      return res.status(500).json({ message: "Unable to log out", error: error.message });
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out" });
    });
  });
};

exports.verifyEmail = async (req, res) => {

  const token = req.params.token;

  const user =
    await User.findOne({
      verificationToken: token
    });

  if (!user) {
    return res.status(400)
      .json({ message: "Invalid token" });
  }

  user.isEmailVerified = true;
  user.verificationToken = null;

  if (user.isPhoneVerified) {
    user.isVerified = true;
  }

  await user.save();

  res.json({
    message: "Email verified successfully"
  });
};