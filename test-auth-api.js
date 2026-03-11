// Simple test script for authentication API
// Run with: node test-auth-api.js

const testRegistration = async () => {
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: "testpassword123",
    name: "Test User"
  };

  console.log("🧪 Testing User Registration...");
  console.log("Test user:", testUser.email);

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testUser),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Registration successful!");
      console.log("User created:", data.user);
      return { success: true, email: testUser.email, password: testUser.password };
    } else {
      console.log("❌ Registration failed:", data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("Make sure the dev server is running: npm run dev");
    return { success: false, error: error.message };
  }
};

// Run test
testRegistration().then((result) => {
  if (result.success) {
    console.log("\n📝 Test Credentials:");
    console.log(`Email: ${result.email}`);
    console.log(`Password: ${result.password}`);
    console.log("\n✨ You can now test login at: http://localhost:3000/auth/signin");
  }
});
