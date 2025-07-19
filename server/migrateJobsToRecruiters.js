import mongoose from "mongoose";
import Job from "./models/Job.js";
import Company from "./models/Company.js";
import Recruiter from "./models/Recruiter.js";
import "dotenv/config";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Migration function
const migrateJobsToRecruiters = async () => {
  try {
    await connectDB();

    console.log("Starting job migration to recruiters...");

    // Find all jobs that have companyId but no recruiterId
    const jobsToMigrate = await Job.find({
      companyId: { $exists: true },
      recruiterId: { $exists: false },
    });

    console.log(`Found ${jobsToMigrate.length} jobs to migrate`);

    if (jobsToMigrate.length === 0) {
      console.log("No jobs need migration");
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const job of jobsToMigrate) {
      try {
        // Find the company that posted this job
        const company = await Company.findById(job.companyId);

        if (!company) {
          console.log(`Skipping job ${job._id} - company not found`);
          skippedCount++;
          continue;
        }

        // Check if there's already a recruiter with this company's email
        let recruiter = await Recruiter.findOne({ email: company.email });

        if (!recruiter) {
          // Create a new recruiter based on the company data
          recruiter = new Recruiter({
            email: company.email,
            password: company.password, // Note: this might need to be hashed
            recruiterType: "Company",
            organizationName: company.name,
            contactPersonName: company.name,
            businessRegistrationNumber: company.businessLicenseFile || "",
            officeAddress: company.website || "",
            website: company.website,
            industry: "General",
            organizationSize: "Medium",
            foundedYear: new Date().getFullYear(),
            logo: company.image,
            displayName: company.name,
            initials: company.name
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")
              .toUpperCase(),
            isVerified: true,
            isEmailVerified: true,
          });

          await recruiter.save();
          console.log(`Created recruiter for company: ${company.name}`);
        }

        // Update the job to use recruiterId instead of companyId
        job.recruiterId = recruiter._id;
        job.companyId = undefined; // Remove the old companyId

        await job.save();
        migratedCount++;

        console.log(`Migrated job: ${job.title} (${job._id})`);
      } catch (error) {
        console.error(`Error migrating job ${job._id}:`, error);
        skippedCount++;
      }
    }

    console.log("\n=== MIGRATION SUMMARY ===");
    console.log(`Total jobs processed: ${jobsToMigrate.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log("========================");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
    process.exit(0);
  }
};

// Run the migration
migrateJobsToRecruiters();
