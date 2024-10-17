import { Request } from "express";

export interface AttackRequest extends Request {
  body: {
    attackerId: string;
    targetId: string;
  };
}

export interface AttackRequestBody {
  attackerId: string;
  targetId: string;
}
