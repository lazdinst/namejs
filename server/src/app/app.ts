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

// Global error handler
app.use(errorHandler);

export default app;
