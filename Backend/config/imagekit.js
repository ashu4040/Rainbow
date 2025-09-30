// config/imagekit.js
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Debug log to confirm it's initialized correctly
console.log("✅ ImageKit initialized. Upload type:", typeof imagekit.upload);

export default imagekit;
