import dotenv from "dotenv";
import AIJobMatching from "./services/aiJobMatching.js";

// Load environment variables
dotenv.config();

console.log("=== OpenAI API Test ===");

async function testOpenAI() {
  try {
    const aiService = new AIJobMatching();

    // Test with a simple resume text
    const testResumeText = `
    John Doe
    Software Developer
    Experience: 3 years in web development
    Skills: JavaScript, React, Node.js, MongoDB
    Education: Bachelor's in Computer Science
    Location: Freetown, Sierra Leone
    `;

    console.log("Testing OpenAI API call...");
    const analysis = await aiService.analyzeResumeWithAI(testResumeText, {
      name: "John Doe",
      email: "john@example.com",
      location: "Freetown, Sierra Leone",
    });

    console.log("✅ OpenAI API call successful!");
    console.log("Analysis result:", JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.log("❌ OpenAI API call failed:");
    console.log("Error type:", error.constructor.name);
    console.log("Error message:", error.message);

    if (error.response) {
      console.log("API Response error:", error.response.data);
    } else if (error.request) {
      console.log("Network error:", error.message);
    }
  }
}

testOpenAI();
