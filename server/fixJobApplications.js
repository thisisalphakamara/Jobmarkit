import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Job from "./models/Job.js";
import JobApplication from "./models/JobApplication.js";

dotenv.config();

async function fixApplications() {
  await connectDB();

  // Find applications with missing or null companyId
  const brokenApps = await JobApplication.find({
    $or: [{ companyId: { $exists: false } }, { companyId: null }],
  });
  console.log(
    `Found ${brokenApps.length} applications with missing companyId.`
  );

  let fixed = 0;
  let failed = 0;

  for (const app of brokenApps) {
    try {
      const job = await Job.findById(app.jobId);
      if (job && job.companyId) {
        app.companyId = job.companyId;
        await app.save();
        console.log(`Fixed application ${app._id}`);
        fixed++;
      } else {
        console.log(`Could not fix application ${app._id} (job not found)`);
        failed++;
      }
    } catch (err) {
      console.error(`Error fixing application ${app._id}:`, err);
      failed++;
    }
  }

  console.log(`Done. Fixed: ${fixed}, Failed: ${failed}`);
  await mongoose.disconnect();
}

fixApplications().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
