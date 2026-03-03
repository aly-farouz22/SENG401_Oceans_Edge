import express from "express";
import cors from "cors";
import gameRoutes from "./routes/gameRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/game", gameRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});