//import './config/instrument.js'
import express from "express";
import cors from "cors";
import "dotenv/config"; // For ES Modules
// or, if using CommonJS:
// require('dotenv').config();
import connectDB from "./config/db.js";
//import * as Sentry from "@sentry/node";
import { clerkWebhooks } from "./controller/webhooks.js";
import companyRoutes from "./routes/companyRoutes.js";
import connectCloudinary from "./config/cloudinary.js";
import JobRoutes from "./routes/jobRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import applicationRoutes from "./routes/application.js";
import interviewRoutes from "./routes/interviewRoutes.js";

// Initialize Express
const app = express();

// Connect to MongoDB
await connectDB();
await connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Routes
app.get("/", (req, res) => res.send("API Working"));

//Sentry.setupExpressErrorHandler(app);

//app.get("/debug-sentry", function mainHandler(req, res) {
//throw new Error("My first Sentry error!");
//});
app.post("/webhooks", clerkWebhooks);
app.use("/api/company", companyRoutes);
app.use("/api/jobs", JobRoutes);
app.use("/api/users", userRoutes);
app.use("/api/application", applicationRoutes);
app.use("/", applicationRoutes);
app.use("/api/company", interviewRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
