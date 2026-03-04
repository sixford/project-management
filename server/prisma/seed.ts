import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function toDelegateKey(fileName: string) {
  // "projectTeam.json" -> "projectTeam"
  return path.basename(fileName, path.extname(fileName));
}

async function deleteAllData(orderedFileNames: string[]) {
  for (const fileName of orderedFileNames) {
    const key = toDelegateKey(fileName);
    const model = (prisma as any)[key];

    if (!model?.deleteMany) {
      console.warn(`No Prisma delegate found for "${key}"`);
      continue;
    }

    await model.deleteMany({});
    console.log(`Cleared data from ${key}`);
  }
}

async function main() {
  const dataDirectory = path.join(__dirname, "seedData");

  const orderedFileNames = [
    "team.json",
    "project.json",
    "projectTeam.json",
    "user.json",
    "task.json",
    "attachment.json",
    "comment.json",
    "taskAssignment.json",
  ];

  await deleteAllData([...orderedFileNames].reverse()); // reverse deletion usually safer

  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const key = toDelegateKey(fileName);
    const model = (prisma as any)[key];

    if (!model?.create) {
      console.warn(`No Prisma delegate found for "${key}"`);
      continue;
    }

    for (const data of jsonData) {
      await model.create({ data: data as any });
    }

    console.log(`Seeded ${key} from ${fileName}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });