import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { discoverNewCharactersUser } from "./updateUserCharacter";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env["PORT"] || 3001;

// Basic middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/interact/:address", async (req, res) => {
  console.log(req.params.address);
  await discoverNewCharactersUser(req.params.address);
  res.json({
    message: "Created a new charcater. Check your Village",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "ShapeTheVillage Backend API",
    version: "1.0.0",
    endpoints: {
      villages: "/api/villages",
      characters: "/api/characters",
      health: "/health",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📖 API: http://localhost:${PORT}`);
});

export default app;
