const express = require("express");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3003";
const DOCUMENT_SERVICE_URL = process.env.DOCUMENT_SERVICE_URL || "http://document-service:3004";

app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Fetch Users from auth-service
app.get("/api/v1/users", authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/v1/users?institutionId=${req.user.institutionId}`, {
      headers: { Authorization: `Bearer ${req.headers.authorization.split(" ")[1]}` },
    });
    const users = await response.json();
    if (!response.ok) throw new Error(users.error || "Failed to fetch users");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Published Documents from document-service
app.get("/api/v1/documents", authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${DOCUMENT_SERVICE_URL}/api/v1/documents/published`, {
      headers: { Authorization: `Bearer ${req.headers.authorization.split(" ")[1]}` },
    });
    const documents = await response.json();
    if (!response.ok) throw new Error(documents.error || "Failed to fetch documents");
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Revision Request
app.post("/api/v1/revision-requests", authMiddleware, async (req, res) => {
  const { documentId, sectionIndex, currentClause, proposedClause, justification } = req.body;
  try {
    const revisionRequest = await prisma.revisionRequest.create({
      data: {
        documentId,
        userId: req.user.id,
        sectionIndex,
        currentClause,
        proposedClause,
        justification,
        status: "Pending",
        institutionId: req.user.institutionId, // Add multi-tenant support
      },
    });
    res.status(201).json(revisionRequest);
  } catch (error) {
    res.status(500).json({ error: "Failed to create revision request" });
  }
});

app.listen(3000, () => {
  console.log("Service 1 is running on port 3000");
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});