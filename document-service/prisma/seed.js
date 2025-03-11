const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seed script started.');

  // Seed Institutions (matching auth_db)
  await prisma.institution.upsert({
    where: { id: 'inst1' },
    update: {},
    create: {
      id: 'inst1',
      name: 'Institution One',
    },
  });

  await prisma.institution.upsert({
    where: { id: 'inst2' },
    update: {},
    create: {
      id: 'inst2',
      name: 'Institution Two',
    },
  });

  // Seed a User (matching auth_db user for JWT compatibility)
  const implementor = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, // Matches auth_db user id
      username: 'implementor1',
      email: 'implementor1@institutionone.edu',
      role: 'IMPLEMENTOR',
      institutionId: 'inst1',
    },
  });

  // Seed a Document with a sample PDF
  const samplePdfPath = path.join(__dirname, 'sample.pdf'); // Local sample file
  const uploadDir = path.join(__dirname, 'uploads');
  const targetPdfPath = path.join(uploadDir, 'sample-policy.pdf'); // Target in uploads/

  // Ensure uploads directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Copy sample.pdf to uploads/ (create sample.pdf locally first)
  if (fs.existsSync(samplePdfPath)) {
    fs.copyFileSync(samplePdfPath, targetPdfPath);
    console.log(`Copied sample.pdf to ${targetPdfPath}`);
  } else {
    console.warn('sample.pdf not found locally; skipping file copy. Create it manually.');
  }

  await prisma.document.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      title: 'Sample Policy Document',
      version: '1.0',
      revision: 'A',
      filePath: '/src/uploads/sample-policy.pdf', // Matches volume path
      status: 'DRAFT',
      institutionId: 'inst1',
      createdById: implementor.id,
      category: 'Academic',
    },
  });

  console.log('Seed script completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });