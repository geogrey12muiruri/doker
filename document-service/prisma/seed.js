const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seed script started.');

  // Seed Institutions to match auth_db
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

  // Seed Users (align with auth_db if possible)
  const implementor = await prisma.user.upsert({
    where: { username: 'implementor1' },
    update: {},
    create: {
      username: 'implementor1',
      email: 'implementor1@institutionone.edu',
      role: 'IMPLEMENTOR',
      institutionId: 'inst1',
    },
  });

  // Seed a sample document
  await prisma.document.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Test Policy',
      version: '1.0',
      revision: 'A',
      status: 'DRAFT',
      institutionId: 'inst1',
      createdById: implementor.id,
      category: 'Test',
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