import { Request, Response, NextFunction } from "express";

const corsConfig = (req: Request, res: Response, next: NextFunction): void => {
  res.header("Access-Control-Allow-Origin", "*"); // Change '*' to a specific origin in production
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
};

export default corsConfig;
