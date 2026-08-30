import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app/app";

describe("REST API", () => {
  it("reports health on /api/status", async () => {
    const res = await request(app).get("/api/status");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("running");
  });

  it("returns both platoons", async () => {
    const res = await request(app).get("/api/platoons");

    expect(res.status).toBe(200);
    expect(res.body.platoons).toHaveLength(2);
    expect(res.body.platoons.map((p: { id: string }) => p.id)).toEqual([
      "usec-1",
      "bear-1",
    ]);
  });

  it("never serves an empty unit status", async () => {
    // Regression: the server used its own UnitStatusType with Idle = "", so every
    // idle unit reached the client with status "".
    const res = await request(app).get("/api/units");

    expect(res.body.units.length).toBeGreaterThan(0);
    for (const unit of res.body.units) {
      expect(unit.status).toBe("idle");
      expect(unit.healthStatus).toBe("healthy");
    }
  });

  it("404s an unknown platoon", async () => {
    const res = await request(app).get("/api/platoons/does-not-exist");
    expect(res.status).toBe(404);
  });
});
