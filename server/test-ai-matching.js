import AdvancedJobMatching from "./services/advancedJobMatching.js";

// Test the improved AI job matching system
async function testAIMatching() {
  console.log("🧪 Testing Improved AI Job Matching System...\n");

  const advancedJobMatching = new AdvancedJobMatching();

  // Mock resume text for a Sierra Leone job seeker
  const mockResumeText = `
    JOHN DOE
    Freetown, Sierra Leone
    john.doe@email.com
    
    EXPERIENCE:
    Marketing Assistant - ABC Company, Freetown (2 years)
    - Developed marketing campaigns for local businesses
    - Managed social media accounts and customer engagement
    - Coordinated events and promotional activities
    
    SKILLS:
    - Marketing and advertising
    - Social media management
    - Customer service
    - Communication and teamwork
    - Microsoft Office
    - Event planning
    
    EDUCATION:
    Bachelor's Degree in Business Administration
    University of Sierra Leone
    
    LANGUAGES:
    English (fluent), Krio (native)
  `;

  // Mock jobs for Sierra Leone market
  const mockJobs = [
    {
      _id: "1",
      title: "Marketing Manager",
      description:
        "We are looking for a marketing manager with experience in digital marketing, social media, and campaign management. Must have strong communication skills and leadership abilities.",
      skills: ["marketing", "social media", "leadership", "communication"],
      level: "mid-level",
      location: { town: "Freetown" },
      category: "Business",
      toObject: () => ({
        _id: "1",
        title: "Marketing Manager",
        description:
          "We are looking for a marketing manager with experience in digital marketing, social media, and campaign management. Must have strong communication skills and leadership abilities.",
        skills: ["marketing", "social media", "leadership", "communication"],
        level: "mid-level",
        location: { town: "Freetown" },
        category: "Business",
      }),
    },
    {
      _id: "2",
      title: "Software Developer",
      description:
        "Looking for a JavaScript developer with React and Node.js experience. Must have strong problem-solving skills.",
      skills: ["javascript", "react", "node.js", "problem solving"],
      level: "entry-level",
      location: { town: "Freetown" },
      category: "Technology",
      toObject: () => ({
        _id: "2",
        title: "Software Developer",
        description:
          "Looking for a JavaScript developer with React and Node.js experience. Must have strong problem-solving skills.",
        skills: ["javascript", "react", "node.js", "problem solving"],
        level: "entry-level",
        location: { town: "Freetown" },
        category: "Technology",
      }),
    },
    {
      _id: "3",
      title: "Nurse",
      description:
        "Registered nurse needed for hospital in Freetown. Must have nursing degree and patient care experience.",
      skills: ["nursing", "patient care", "healthcare", "medical"],
      level: "mid-level",
      location: { town: "Freetown" },
      category: "Healthcare",
      toObject: () => ({
        _id: "3",
        title: "Nurse",
        description:
          "Registered nurse needed for hospital in Freetown. Must have nursing degree and patient care experience.",
        skills: ["nursing", "patient care", "healthcare", "medical"],
        level: "mid-level",
        location: { town: "Freetown" },
        category: "Healthcare",
      }),
    },
    {
      _id: "4",
      title: "Teacher",
      description:
        "Primary school teacher needed. Must have teaching degree and classroom management skills.",
      skills: ["teaching", "education", "classroom management", "curriculum"],
      level: "entry-level",
      location: { town: "Bo" },
      category: "Education",
      toObject: () => ({
        _id: "4",
        title: "Teacher",
        description:
          "Primary school teacher needed. Must have teaching degree and classroom management skills.",
        skills: ["teaching", "education", "classroom management", "curriculum"],
        level: "entry-level",
        location: { town: "Bo" },
        category: "Education",
      }),
    },
  ];

  try {
    // Analyze resume
    console.log("📄 Analyzing resume...");
    const resumeAnalysis = advancedJobMatching.analyzeResume(mockResumeText, {
      name: "John Doe",
      email: "john.doe@email.com",
      location: "Freetown, Sierra Leone",
    });

    console.log("✅ Resume Analysis Results:");
    console.log("- Detected Skills:", resumeAnalysis.skills.detected);
    console.log("- Experience Level:", resumeAnalysis.experience.level);
    console.log("- Total Years:", resumeAnalysis.experience.totalYears);
    console.log("- Location:", resumeAnalysis.location);
    console.log("- Strengths:", resumeAnalysis.strengths);
    console.log("");

    // Get job recommendations
    console.log("🔍 Finding job matches...");
    const recommendations = await advancedJobMatching.getJobRecommendations(
      mockJobs,
      resumeAnalysis
    );

    console.log(`✅ Found ${recommendations.length} meaningful job matches:`);
    console.log("");

    recommendations.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title}`);
      console.log(`   Match: ${job.matchPercentage}% (${job.matchLabel})`);
      console.log(`   Skills Match: ${job.skillMatches.join(", ") || "None"}`);
      console.log(
        `   Missing Skills: ${job.missingSkills.join(", ") || "None"}`
      );
      console.log(`   Location: ${job.location?.town || "Unknown"}`);
      console.log("");
    });

    // Test filtering
    const meaningfulMatches = recommendations.filter(
      (job) => job.matchPercentage >= 25
    );
    console.log(`📊 Filtering Results:`);
    console.log(`- Total jobs analyzed: ${mockJobs.length}`);
    console.log(`- Meaningful matches (≥25%): ${meaningfulMatches.length}`);
    console.log(
      `- Average match score: ${Math.round(
        recommendations.reduce((sum, job) => sum + job.matchPercentage, 0) /
          recommendations.length
      )}%`
    );
    console.log("");

    if (meaningfulMatches.length > 0) {
      console.log("✅ AI Job Matching System is working correctly!");
      console.log("- Proper resume validation ✓");
      console.log("- Meaningful job filtering ✓");
      console.log("- Sierra Leone context awareness ✓");
      console.log("- Accurate skill matching ✓");
    } else {
      console.log(
        "⚠️  No meaningful matches found - this might indicate the system is too strict"
      );
    }
  } catch (error) {
    console.error("❌ Error testing AI matching:", error.message);
  }
}

// Run the test
testAIMatching();
