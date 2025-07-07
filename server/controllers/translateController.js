import translationService from "../services/translationService.js";
import Job from "../models/Job.js";

// Translate job posting
export const translateJob = async (req, res) => {
  try {
    const { title, description, originalLanguage } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        success: false,
        message: "Title or description is required for translation",
      });
    }

    const translationResult = await translationService.translateJob({
      title: title || "",
      description: description || "",
      originalLanguage: originalLanguage || "en",
    });

    res.json({
      success: true,
      message: "Translation completed successfully",
      translations: {
        titleEnglish: translationResult.titleEnglish,
        titleKrio: translationResult.titleKrio,
        descriptionEnglish: translationResult.descriptionEnglish,
        descriptionKrio: translationResult.descriptionKrio,
      },
      originalLanguage: translationResult.originalLanguage,
      translationStatus: translationResult.translationStatus,
    });
  } catch (error) {
    console.error("Error translating job:", error);
    res.status(500).json({
      success: false,
      message: "Error translating job",
      error: error.message,
    });
  }
};

// Re-translate all existing jobs
export const retranslateAllJobs = async (req, res) => {
  try {
    // Get all jobs that don't have Krio translations or have failed translations
    const jobsToTranslate = await Job.find({
      $or: [
        { descriptionKrio: { $exists: false } },
        { descriptionKrio: "" },
        { translationStatus: "failed" },
        { translationStatus: "pending" },
      ],
    });

    if (jobsToTranslate.length === 0) {
      return res.json({
        success: true,
        message: "All jobs already have translations",
        jobsTranslated: 0,
      });
    }

    let translatedCount = 0;
    let failedCount = 0;

    for (const job of jobsToTranslate) {
      try {
        const translationResult = await translationService.translateJob({
          title: job.title,
          description: job.description,
          originalLanguage: job.originalLanguage || "en",
        });

        // Update the job with new translations
        job.titleKrio = translationResult.titleKrio;
        job.descriptionKrio = translationResult.descriptionKrio;
        job.titleEnglish = translationResult.titleEnglish;
        job.descriptionEnglish = translationResult.descriptionEnglish;
        job.translationStatus = translationResult.translationStatus;
        job.translationTimestamp = translationResult.translationTimestamp;

        await job.save();
        translatedCount++;
      } catch (error) {
        console.error(`Failed to translate job ${job._id}:`, error);
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Translation completed. ${translatedCount} jobs translated, ${failedCount} failed.`,
      jobsTranslated: translatedCount,
      jobsFailed: failedCount,
      totalJobs: jobsToTranslate.length,
    });
  } catch (error) {
    console.error("Error re-translating all jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error re-translating jobs",
      error: error.message,
    });
  }
};
