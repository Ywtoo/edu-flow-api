import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./src/routes/auth.routes.js";
import courseRoutes from "./src/routes/course.routes.js";
import { initDatabase } from "./src/config/schema.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/courses', courseRoutes);


initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ O servidor não pode iniciar sem o banco:", err);
  });