import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
};

// Initialize Cloudinary
connectCloudinary();

// Utility function to upload a file
export const uploadToCloudinary = (filePath, folder = "uploads") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder }, (error, result) => {
      // Optionally delete the file after upload
      fs.unlink(filePath, () => {});
      if (error) return reject(error);
      resolve(result);
    });
  });
};

export default cloudinary;
