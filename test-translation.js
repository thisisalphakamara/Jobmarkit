import axios from "axios";

// Test the translation endpoint
async function testTranslation() {
  try {
    console.log("Testing translation service...");

    const testData = {
      title: "Web Developer",
      description:
        "We are seeking a skilled Web Developer to design, develop, and maintain high-quality websites and web applications.",
      originalLanguage: "en",
    };

    const response = await axios.post(
      "http://localhost:5000/api/translate/job",
      testData
    );

    console.log("Translation Response:");
    console.log("Success:", response.data.success);
    console.log("Message:", response.data.message);
    console.log("Krio Title:", response.data.translations.titleKrio);
    console.log(
      "Krio Description:",
      response.data.translations.descriptionKrio
    );
  } catch (error) {
    console.error(
      "Translation test failed:",
      error.response?.data || error.message
    );
  }
}

testTranslation();
