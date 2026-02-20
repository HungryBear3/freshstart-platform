/**
 * Quick diagnostic script to check if prenup sections are in the database
 * Run with: npx tsx scripts/check-prenup-seed.ts
 */

import { prisma } from "@/lib/db/prisma";

async function checkPrenupSeed() {
  try {
    console.log("Checking questionnaire database...\n");

    // Check Petition questionnaire
    const petition = await prisma.questionnaire.findUnique({
      where: { type: "petition" },
    });

    if (!petition) {
      console.log("❌ Petition questionnaire not found in database");
      return;
    }

    console.log("✅ Petition questionnaire found");
    const petitionStructure = petition.structure as any;
    const sections = petitionStructure?.sections || [];

    console.log(`\nPetition has ${sections.length} sections:`);
    sections.forEach((section: any, index: number) => {
      console.log(`  ${index + 1}. ${section.id} - ${section.title}`);
    });

    const prenupSection = sections.find(
      (s: any) => s.id === "prenup-info"
    );
    if (prenupSection) {
      console.log("\n✅ Prenup section found in Petition!");
      console.log(`   Title: ${prenupSection.title}`);
      console.log(`   Questions: ${prenupSection.questions?.length || 0}`);
    } else {
      console.log("\n❌ Prenup section NOT found in Petition");
      console.log("   You need to re-seed the questionnaires");
    }

    // Check Marital Settlement questionnaire
    const msa = await prisma.questionnaire.findUnique({
      where: { type: "marital_settlement" },
    });

    if (!msa) {
      console.log("\n❌ Marital Settlement questionnaire not found");
      return;
    }

    console.log("\n✅ Marital Settlement questionnaire found");
    const msaStructure = msa.structure as any;
    const msaSections = msaStructure?.sections || [];

    console.log(`\nMarital Settlement has ${msaSections.length} sections:`);
    msaSections.forEach((section: any, index: number) => {
      console.log(`  ${index + 1}. ${section.id} - ${section.title}`);
    });

    const prenupSummarySection = msaSections.find(
      (s: any) => s.id === "prenup-summary"
    );
    if (prenupSummarySection) {
      console.log("\n✅ Prenup summary section found in Marital Settlement!");
      console.log(`   Title: ${prenupSummarySection.title}`);
      console.log(`   Questions: ${prenupSummarySection.questions?.length || 0}`);
    } else {
      console.log("\n❌ Prenup summary section NOT found in Marital Settlement");
      console.log("   You need to re-seed the questionnaires");
    }

    // Check legal content
    console.log("\n--- Checking Legal Content ---");
    const prenupContent = await prisma.legalContent.findUnique({
      where: { slug: "prenups-in-illinois" },
    });

    if (prenupContent) {
      console.log("✅ Prenup legal content found in database");
      console.log(`   Title: ${prenupContent.title}`);
      console.log(`   Published: ${prenupContent.published}`);
    } else {
      console.log("❌ Prenup legal content NOT found in database");
      console.log("   You need to re-seed the legal content");
    }
  } catch (error) {
    console.error("Error checking seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrenupSeed();
