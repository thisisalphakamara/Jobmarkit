import dotenv from "dotenv";
import AIJobMatching from "./services/aiJobMatching.js";

// Load environment variables
dotenv.config();

console.log("=== AI Service Test ===");
console.log("Environment variables loaded:", {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
  NODE_ENV: process.env.NODE_ENV,
});

// Test AI service initialization
try {
  const aiService = new AIJobMatching();
  console.log("✅ AI service initialized successfully");

  // Test API key
  if (!aiService.openaiApiKey) {
    console.log("❌ OpenAI API key is missing");
  } else if (aiService.openaiApiKey === "your_openai_api_key_here") {
    console.log("❌ OpenAI API key is still the placeholder value");
  } else {
    console.log("✅ OpenAI API key is set");
  }
} catch (error) {
  console.log("❌ Error initializing AI service:", error.message);
}

console.log("=== Test Complete ===");
