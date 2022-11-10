import test from "ava";
import supertest from "supertest";
import { testServer } from "@indiekit-test/server";

test("Returns 400 with no `request_uri`", async (t) => {
  const server = await testServer();
  const request = supertest.agent(server);

  const result = await request.get("/auth/consent");

  t.is(result.status, 400);
  t.true(result.text.includes("Missing parameter: <code>request_uri</code>"));

  server.close(t);
});
