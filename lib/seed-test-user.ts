/**
 * Script to create a test user account for development/testing
 */

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function seedTestUser() {
  console.log("Creating test user...");

  const testEmail = "test@example.com";
  const testPassword = "test123456";
  const testName = "Test User";

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    if (existingUser) {
      console.log(`Test user already exists: ${testEmail}`);
      console.log("Password: test123456");
      return existingUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: testName,
        emailVerified: new Date(), // Auto-verify for test user
      },
    });

    console.log("✓ Test user created successfully!");
    console.log("Email: test@example.com");
    console.log("Password: test123456");
    console.log("Note: This user is pre-verified for testing.");

    return user;
  } catch (error) {
    console.error("Error creating test user:", error);
    throw error;
  }
}

// Export default for use in API routes
export default seedTestUser;
