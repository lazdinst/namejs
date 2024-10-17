import express from "express";
import corsConfig from "../middleware/corsConfig";
import requestLogger from "../middleware/requestLogger";
import errorHandler from "../middleware/errorHandler";
import routes from "./routes";

const app = express();

// Middleware setup
app.use(express.json());
app.use(corsConfig);
app.use(requestLogger);

// Register routes
app.use("/api", routes);

app.get("/test", (req, res) => {
  res.send("Test route working!");
});

// // Global error handler
// app.use(errorHandler);

// app.use("*", (req, res) => {
//   res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`);
// });

// app.get("/test", (req, res) => {
//   res.send("Test route working!");
// });

export default app;
