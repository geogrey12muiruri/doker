const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seed script started.');

  // Institutions
  await prisma.institution.upsert({
    where: { id: 'inst1' },
    update: { name: 'Institution One' },
    create: {
      id: 'inst1',
      name: 'Institution One',
    },
  });
  console.log('Institution inst1 processed.');

  await prisma.institution.upsert({
    where: { id: 'inst2' },
    update: { name: 'Institution Two' },
    create: {
      id: 'inst2',
      name: 'Institution Two',
    },
  });
  console.log('Institution inst2 processed.');

  // Users
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { username: 'implementor1' },
    update: { email: 'implementor1@example.com', passwordHash, role: 'IMPLEMENTOR', institutionId: 'inst1', firstName: 'John', lastName: 'Doe', emailVerified: true },
    create: {
      username: 'implementor1',
      email: 'implementor1@example.com',
      passwordHash,
      role: 'IMPLEMENTOR',
      institutionId: 'inst1',
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
    },
  });
  console.log('User implementor1 processed.');

  await prisma.user.upsert({
    where: { username: 'hod1' },
    update: { email: 'hod1@example.com', passwordHash, role: 'HOD', institutionId: 'inst2', firstName: 'Jane', lastName: 'Smith', emailVerified: true },
    create: {
      username: 'hod1',
      email: 'hod1@example.com',
      passwordHash,
      role: 'HOD',
      institutionId: 'inst2',
      firstName: 'Jane',
      lastName: 'Smith',
      emailVerified: true,
    },
  });
  console.log('User hod1 processed.');

  await prisma.user.upsert({
    where: { username: 'staff1' },
    update: { email: 'staff1@example.com', passwordHash, role: 'STAFF', institutionId: 'inst1', firstName: 'Alice', lastName: 'Johnson', emailVerified: true },
    create: {
      username: 'staff1',
      email: 'staff1@example.com',
      passwordHash,
      role: 'STAFF',
      institutionId: 'inst1',
      firstName: 'Alice',
      lastName: 'Johnson',
      emailVerified: true,
    },
  });
  console.log('User staff1 processed.');

  await prisma.user.upsert({
    where: { username: 'student1' },
    update: { email: 'student1@example.com', passwordHash, role: 'STUDENT', institutionId: 'inst2', firstName: 'Bob', lastName: 'Brown', emailVerified: true },
    create: {
      username: 'student1',
      email: 'student1@example.com',
      passwordHash,
      role: 'STUDENT',
      institutionId: 'inst2',
      firstName: 'Bob',
      lastName: 'Brown',
      emailVerified: true,
    },
  });
  console.log('User student1 processed.');

  console.log('Seed script completed.');
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Prisma disconnected.');
  });