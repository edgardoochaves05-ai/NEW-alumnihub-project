import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({ path: "../.env" });

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`AlumniHub API running on http://localhost:${PORT}`);
});
