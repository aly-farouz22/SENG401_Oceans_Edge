// path: server/index.ts
import express from "express";
import gameRouter from "./routes/game";

const app = express();
app.use(express.json());

// mount the game routes
app.use("/api/game", gameRouter);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});