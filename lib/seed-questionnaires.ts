/**
 * Script to seed sample questionnaires into the database.
 *
 * The definitions themselves live in `lib/questionnaires/seed-structures.ts`,
 * which imports no Prisma, so compatibility checks can read them directly.
 */

import { prisma } from "@/lib/db";
import { SEED_QUESTIONNAIRES } from "@/lib/questionnaires/seed-structures";


export async function seedQuestionnaires() {
  console.log("Seeding questionnaires...");

  for (const questionnaire of SEED_QUESTIONNAIRES) {
    try {
      await prisma.questionnaire.upsert({
        where: { type: questionnaire.type },
        update: {
          name: questionnaire.name,
          description: questionnaire.description,
          structure: questionnaire.structure as any,
          isActive: true,
        },
        create: {
          name: questionnaire.name,
          type: questionnaire.type,
          description: questionnaire.description,
          structure: questionnaire.structure as any,
          isActive: true,
        },
      });

      console.log(`✓ Upserted questionnaire: ${questionnaire.name}`);
    } catch (error) {
      console.error(`Error creating questionnaire "${questionnaire.name}":`, error);
    }
  }

  console.log("Questionnaire seeding complete!");
}

// Export for use in API routes and scripts
export default seedQuestionnaires;
