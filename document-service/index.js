const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const multer = require("multer"); // Added multer import
const path = require("path"); // Added path import

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" }); // Initialize upload variable

app.use(cors());
app.use(express.json());

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

// Role-based middleware
const restrictToRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: `Restricted to ${role} role` });
  }
  next();
};

// Fetch All Documents (for authenticated users within institution)
app.get('/api/v1/documents', authMiddleware, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: { institutionId: req.user.institutionId },
      include: { changes: true },
    });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Fetch Published Documents (accessible to all authenticated users in institution)
app.get("/api/v1/documents/published", authMiddleware, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      where: {
        status: "PUBLISHED",
        institutionId: req.user.institutionId,
      },
    });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch published documents" });
  }
});

// Upload endpoint (fixed with multer)
app.post('/api/v1/documents/upload', authMiddleware, restrictToRole('IMPLEMENTOR'), upload.single('file'), async (req, res) => {
  try {
    const { title, version, revision, category } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const document = await prisma.document.create({
      data: {
        title: title || file.originalname.replace('.pdf', ''),
        version: version || '1.0',
        revision: revision || 'A',
        filePath: path.join('uploads', file.filename),
        status: 'DRAFT',
        institutionId: req.user.institutionId,
        createdById: req.user.id,
        category: category || 'Uncategorized',
      },
    });
    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Update and Publish a Document (Implementor only)
app.put("/api/v1/documents/:id", authMiddleware, restrictToRole("IMPLEMENTOR"), async (req, res) => {
  const { title, version, revision, content, status } = req.body;
  const documentId = parseInt(req.params.id);

  try {
    const document = await prisma.document.update({
      where: { id: documentId },
      data: {
        title,
        version,
        revision,
        content,
        status, // e.g., "DRAFT" -> "PUBLISHED"
        updatedAt: new Date(),
      },
    });
    res.json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// Propose a Change to a Document (Staff only)
app.post("/api/v1/documents/:id/propose-change", authMiddleware, restrictToRole("STAFF"), async (req, res) => {
  const { clause, proposedChange, justification } = req.body;
  const documentId = parseInt(req.params.id);

  try {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) return res.status(404).json({ error: "Document not found" });

    const change = await prisma.change.create({
      data: {
        clause,
        proposedChange,
        justification,
        status: "PENDING",
        documentId,
        proposerId: req.user.id,
      },
    });
    // TODO: Notify HOD (e.g., via notification-service)
    res.status(201).json(change);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to propose change" });
  }
});

// Review a Change (HOD only)
app.put("/api/v1/changes/:id/review", authMiddleware, restrictToRole("HOD"), async (req, res) => {
  const { status, rejectionReason } = req.body; // status: "APPROVED" or "REJECTED"
  const changeId = parseInt(req.params.id);

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status. Use APPROVED or REJECTED" });
  }

  try {
    const change = await prisma.change.findUnique({ where: { id: changeId } });
    if (!change || change.status !== "PENDING") {
      return res.status(400).json({ error: "Change not found or not pending" });
    }

    const updatedChange = await prisma.change.update({
      where: { id: changeId },
      data: {
        status,
        hodId: req.user.id,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        updatedAt: new Date(),
      },
    });

    // TODO: Notify proposer if REJECTED, or Implementor if APPROVED
    res.json(updatedChange);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to review change" });
  }
});

// Fetch document content
app.get('/api/v1/documents/:id/content', authMiddleware, async (req, res) => {
  try {
    const documentId = parseInt(req.params.id);
    const document = await prisma.document.findFirst({
      where: { id: documentId, institutionId: req.user.institutionId },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });

    if (document.filePath) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + document.title + '.pdf"');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(path.resolve(document.filePath));
    } else {
      res.json({ content: document.content });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch document content' });
  }
});

// Verify and Implement a Change (Implementor only)
app.put("/api/v1/changes/:id/verify", authMiddleware, restrictToRole("IMPLEMENTOR"), async (req, res) => {
  const changeId = parseInt(req.params.id);

  try {
    const change = await prisma.change.findUnique({ where: { id: changeId } });
    if (!change || change.status !== "APPROVED") {
      return res.status(400).json({ error: "Change not found or not approved" });
    }

    const updatedChange = await prisma.change.update({
      where: { id: changeId },
      data: {
        status: "IMPLEMENTED",
        implementorId: req.user.id,
        updatedAt: new Date(),
      },
    });

    // Optionally update the document content here or leave it to a separate endpoint
    // TODO: Notify HOD and proposer that change is implemented
    res.json(updatedChange);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to verify change" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Document Service running on port ${PORT}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Prisma disconnected");
  process.exit(0);
});