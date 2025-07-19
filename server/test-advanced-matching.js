import AdvancedJobMatching from "./services/advancedJobMatching.js";

console.log("=== Advanced Job Matching Test ===");

async function testAdvancedMatching() {
  try {
    const advancedMatching = new AdvancedJobMatching();

    // Test resume analysis
    const testResumeText = `
    John Doe
    Software Developer
    Experience: 3 years in web development
    Skills: JavaScript, React, Node.js, MongoDB, Leadership, Communication
    Education: Bachelor's in Computer Science
    Location: Freetown, Sierra Leone
    Languages: English, Krio
    Certifications: AWS Certified Developer
    `;

    console.log("Testing resume analysis...");
    const analysis = advancedMatching.analyzeResume(testResumeText, {
      name: "John Doe",
      email: "john@example.com",
      location: "Freetown, Sierra Leone",
    });

    console.log("✅ Resume analysis successful!");
    console.log("Analysis result:", JSON.stringify(analysis, null, 2));

    // Test job matching
    const testJob = {
      _id: "test-job-1",
      title: "Senior Software Developer",
      description:
        "We are looking for a skilled developer with experience in JavaScript, React, and Node.js. Must have strong leadership skills and experience with MongoDB.",
      category: "Technology",
      level: "senior",
      location: {
        town: "Freetown",
        district: "Western Area Urban",
        province: "Western Area",
      },
      salary: 5000000,
      workType: "Full-time",
      workSetup: "Hybrid",
      toObject: function () {
        return {
          _id: this._id,
          title: this.title,
          description: this.description,
          category: this.category,
          level: this.level,
          location: this.location,
          salary: this.salary,
          workType: this.workType,
          workSetup: this.workSetup,
        };
      },
    };

    console.log("\nTesting job matching...");
    const matchResult = advancedMatching.calculateJobMatch(testJob, analysis);

    console.log("✅ Job matching successful!");
    console.log("Match result:", JSON.stringify(matchResult, null, 2));

    // Test job recommendations
    const testJobs = [testJob];
    console.log("\nTesting job recommendations...");
    const recommendations = await advancedMatching.getJobRecommendations(
      testJobs,
      analysis
    );

    console.log("✅ Job recommendations successful!");
    console.log("Recommendations:", JSON.stringify(recommendations, null, 2));
  } catch (error) {
    console.log("❌ Advanced job matching test failed:");
    console.log("Error type:", error.constructor.name);
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
  }
}

testAdvancedMatching();
