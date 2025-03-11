const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

app.use(express.json());
app.use(cors());

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Login
app.post("/api/v1/login", async (req, res) => {
  const { username, password, institutionId } = req.body;
  if (!institutionId) return res.status(400).json({ error: "Institution ID required" });

  const user = await prisma.user.findFirst({
    where: { username, institutionId },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.emailVerified) {
    return res.status(403).json({ error: "Email not verified" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, institutionId: user.institutionId },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
  res.json({ token, user: { id: user.id, username, role: user.role, institutionId } });
});

// Validate Token
app.post("/api/v1/validate", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: "Invalid token" });
  }
});

// Middleware to verify JWT and extract user info
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get current user
app.get("/api/v1/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, username: true, role: true, institutionId: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// Get User by ID (for other services)
app.get("/api/v1/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, username: true, role: true, institutionId: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Get All Users for an Institution (for other services)
app.get("/api/v1/users", async (req, res) => {
  const { institutionId } = req.query;
  if (!institutionId) return res.status(400).json({ error: "Institution ID required" });
  const users = await prisma.user.findMany({
    where: { institutionId },
    select: { id: true, username: true, role: true, institutionId: true },
  });
  res.json(users);
});

// Get Institutions
app.get("/api/v1/institutions", async (req, res) => {
  const institutions = await prisma.institution.findMany();
  res.json(institutions);
});

// Register User
app.post("/api/v1/register", async (req, res) => {
  const { username, email, password, firstName, lastName, institutionId } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        institutionId,
        emailVerificationToken,
      },
    });

    const verificationLink = `http://localhost:3003/api/v1/verify-email?token=${emailVerificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email",
      text: `Click the link to verify your email: ${verificationLink}`,
    });

    res.status(201).json({ message: "User registered. Please verify your email." });
  } catch (err) {
    res.status(400).json({ error: "User registration failed" });
  }
});

// Verify Email
app.get("/api/v1/verify-email", async (req, res) => {
  const { token } = req.query;
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: token },
  });

  if (!user) return res.status(400).json({ error: "Invalid token" });

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });

  res.json({ message: "Email verified successfully" });
});

// Password Reset Request
app.post("/api/v1/password-reset-request", async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return res.status(404).json({ error: "User not found" });

  const passwordResetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken, passwordResetExpires },
  });

  const resetLink = `http://localhost:3003/api/v1/reset-password?token=${passwordResetToken}`;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset",
    text: `Click the link to reset your password: ${resetLink}`,
  });

  res.json({ message: "Password reset link sent" });
});

// Reset Password
app.post("/api/v1/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } },
  });

  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });

  res.json({ message: "Password reset successfully" });
});

app.listen(3003, () => {
  console.log("Auth Service running on port 3003");
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});