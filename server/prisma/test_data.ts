import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function reset() {
  // Delete in FK-safe order (children before parents). Join tables
  // (_ProfessorCourses, _ReviewTags) cascade automatically.
  await prisma.vote.deleteMany();
  await prisma.review.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.course.deleteMany();
  await prisma.department.deleteMany();
  await prisma.university.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();

  // 1. Create universities
  const stateUni = await prisma.university.create({
    data: { name: "State University" },
  });

  const techUni = await prisma.university.create({
    data: { name: "Metro Tech University" },
  });

  // 2. Create departments (linked to a university via universityId)
  const csDept = await prisma.department.create({
    data: { name: "Computer Science", universityId: stateUni.id },
  });

  const mathDept = await prisma.department.create({
    data: { name: "Mathematics", universityId: stateUni.id },
  });

  const engDept = await prisma.department.create({
    data: { name: "Engineering", universityId: techUni.id },
  });

  // 3. Create courses, each scoped to the department that teaches it
  const cs101 = await prisma.course.create({
    data: { code: "CS 101", name: "Intro to Computer Science", departmentId: csDept.id },
  });

  const cs201 = await prisma.course.create({
    data: { code: "CS 201", name: "Data Structures", departmentId: csDept.id },
  });

  const math101 = await prisma.course.create({
    data: { code: "MATH 101", name: "Calculus I", departmentId: mathDept.id },
  });

  const eng150 = await prisma.course.create({
    data: { code: "ENG 150", name: "Intro to Engineering Design", departmentId: engDept.id },
  });

  // 4. Create professors, linked to a department and to the courses they teach
  const profSmith = await prisma.professor.create({
    data: {
      name: "Dr. Smith",
      departmentId: csDept.id,
      courses: {
        connect: [{ id: cs101.id }, { id: cs201.id }],
      },
    },
  });

  const profJones = await prisma.professor.create({
    data: {
      name: "Dr. Jones",
      departmentId: csDept.id,
      courses: {
        connect: [{ id: cs101.id }],
      },
    },
  });

  const profGarcia = await prisma.professor.create({
    data: {
      name: "Dr. Garcia",
      departmentId: mathDept.id,
      courses: {
        connect: [{ id: math101.id }],
      },
    },
  });

  const profLee = await prisma.professor.create({
    data: {
      name: "Dr. Lee",
      departmentId: engDept.id,
      courses: {
        connect: [{ id: eng150.id }],
      },
    },
  });

  // 5. Create your predefined tag list
  const tagLabels = [
    "Heavy Workload",
    "Clear Explanations",
    "Flexible Deadlines",
    "Cold Calls Students",
    "Curves Grades",
    "Fast Grader",
    "Engaging Lectures",
    "Strict Attendance",
  ];

// insert all tags at once, converting each string to { label: ... } and skipping any that already exist
  await prisma.tag.createMany({
    data: tagLabels.map((label) => ({ label })),
    skipDuplicates: true,
  });

// 6. Create test users
  const testPasswordHash = await bcrypt.hash("password123", 10);

  const userOne = await prisma.user.create({
    data: { email: "teststudent1@example.com", password: testPasswordHash },
  });

  const userTwo = await prisma.user.create({
    data: { email: "teststudent2@example.com", password: testPasswordHash },
  });

  console.log("Seed data created successfully:");
  console.log({
    stateUni,
    techUni,
    profSmith,
    profJones,
    profGarcia,
    profLee,
    userOne,
    userTwo,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });