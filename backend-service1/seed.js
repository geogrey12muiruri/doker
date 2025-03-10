const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seed() {
  try {
    // Clear existing data for a clean slate
    await prisma.revisionRequest.deleteMany();
    await prisma.document.deleteMany();
    await prisma.user.deleteMany();
    await prisma.department.deleteMany();
    await prisma.faculty.deleteMany();
    await prisma.institution.deleteMany();
    console.log("Cleared existing data");

    // Seed Institutions
    const uniA = await prisma.institution.create({ data: { name: "University A" } });
    const uniB = await prisma.institution.create({ data: { name: "University B" } });
    console.log("Seeded institutions");

    // Seed Faculties
    await prisma.faculty.createMany({
      data: [
        { name: "Faculty of Science", institutionId: uniA.id },
        { name: "Faculty of Arts", institutionId: uniB.id },
      ],
    });
    console.log("Seeded faculties");

    // Seed Departments
    const scienceFacultyA = await prisma.faculty.findFirst({ where: { name: "Faculty of Science", institutionId: uniA.id } });
    const artsFacultyB = await prisma.faculty.findFirst({ where: { name: "Faculty of Arts", institutionId: uniB.id } });
    await prisma.department.createMany({
      data: [
        { name: "Computer Science", facultyId: scienceFacultyA.id, institutionId: uniA.id },
        { name: "Literature", facultyId: artsFacultyB.id, institutionId: uniB.id },
      ],
    });
    console.log("Seeded departments");

    // Seed Users
    const csDeptA = await prisma.department.findFirst({ where: { name: "Computer Science", institutionId: uniA.id } });
    const litDeptB = await prisma.department.findFirst({ where: { name: "Literature", institutionId: uniB.id } });
    await prisma.user.createMany({
      data: [
        {
          username: "admin_a",
          passwordHash: await bcrypt.hash("admin123", 10),
          role: "implementor",
          institutionId: uniA.id,
          email: "admin@university-a.ac.ke",
        },
        {
          username: "hod_cs_a",
          passwordHash: await bcrypt.hash("hod123", 10),
          role: "hod",
          departmentId: csDeptA.id,
          institutionId: uniA.id,
          email: "hod.cs@university-a.ac.ke",
        },
        {
          username: "staff_cs_a",
          passwordHash: await bcrypt.hash("staff123", 10),
          role: "staff",
          departmentId: csDeptA.id,
          institutionId: uniA.id,
          email: "staff.cs@university-a.ac.ke",
        },
        {
          username: "student_cs_a",
          passwordHash: await bcrypt.hash("student123", 10),
          role: "student",
          departmentId: csDeptA.id,
          institutionId: uniA.id,
          email: "student.cs@university-a.ac.ke",
        },
        {
          username: "hod_lit_b",
          passwordHash: await bcrypt.hash("hodlit123", 10),
          role: "hod",
          departmentId: litDeptB.id,
          institutionId: uniB.id,
          email: "hod.lit@university-b.ac.ke",
        },
      ],
    });
    console.log("Seeded users");

    // Seed Documents
    const adminA = await prisma.user.findFirst({ where: { username: "admin_a" } });
    await prisma.document.createMany({
      data: [
        {
          title: "Exam Policy A",
          version: "1.0",
          revision: "Rev 1",
          content: {
            sections: [
              { title: "Attendance", clause: "Attendance is mandatory." },
              { title: "Grading", clause: "Grades due in 2 weeks." },
            ],
          },
          status: "Published",
          createdBy: adminA.id,
          institutionId: uniA.id,
        },
        {
          title: "Leave Policy CS A",
          version: "1.0",
          revision: "Rev 1",
          content: { sections: [{ title: "Application", clause: "Apply 7 days in advance." }] },
          status: "Draft",
          createdBy: adminA.id,
          institutionId: uniA.id,
        },
        {
          title: "Library Policy B",
          version: "1.0",
          revision: "Rev 1",
          content: { sections: [{ title: "Borrowing", clause: "Max 3 books." }] },
          status: "Published",
          createdBy: adminA.id,
          institutionId: uniB.id, // Created by Uni A's admin, but for Uni B (cross-tenant test)
        },
      ],
    });
    console.log("Seeded documents");

    // Seed Revision Requests
    const examDocA = await prisma.document.findFirst({ where: { title: "Exam Policy A", institutionId: uniA.id } });
    const hodCSA = await prisma.user.findFirst({ where: { username: "hod_cs_a" } });
    const staffCSA = await prisma.user.findFirst({ where: { username: "staff_cs_a" } });
    const studentCSA = await prisma.user.findFirst({ where: { username: "student_cs_a" } });
    await prisma.revisionRequest.createMany({
      data: [
        {
          documentId: examDocA.id,
          userId: staffCSA.id,
          sectionIndex: 0,
          currentClause: "Attendance is mandatory.",
          proposedClause: "Attendance is mandatory unless excused.",
          justification: "Allow medical exceptions.",
          status: "Pending",
          hodId: hodCSA.id,
        },
        {
          documentId: examDocA.id,
          userId: studentCSA.id,
          sectionIndex: 1,
          currentClause: "Grades due in 2 weeks.",
          proposedClause: "Grades due in 3 weeks.",
          justification: "More time for large classes.",
          status: "Approved",
          hodId: hodCSA.id,
          hodDecision: "Reasonable adjustment.",
        },
      ],
    });
    console.log("Seeded revision requests");

    console.log("Seeding completed!");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();