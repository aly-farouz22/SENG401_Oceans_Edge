import express from "express";
import cors from "cors";
import gameRoutes from "./routes/gameRoutes";

const app = express();

app.use(cors());
app.use(express.json());

// To check if backend is basicallyy alive after deploying it
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/game", gameRoutes);

const PORT = Number(process.env.PORT) || 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});