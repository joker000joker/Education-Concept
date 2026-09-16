require('dotenv').config();
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (key) {
  const parts = key.split(".");
  console.log(Buffer.from(parts[1], "base64").toString());
} else {
  console.log("No key");
}
