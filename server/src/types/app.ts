import { Request } from "express";
import { ParsedQs } from "qs";

export interface TypedRequestBody<T> extends Request {
  body: T;
}

export interface TypedRequestQuery<T extends ParsedQs> extends Request {
  query: T;
}
