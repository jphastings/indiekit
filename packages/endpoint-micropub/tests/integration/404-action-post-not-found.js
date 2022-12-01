import test from "ava";
import supertest from "supertest";
import { testServer } from "@indiekit-test/server";
import { testToken } from "@indiekit-test/token";

test("Returns 404 error action not supported (by scope)", async (t) => {
  // Create post
  const server = await testServer();
  const request = supertest.agent(server);
  const result = await request
    .post("/micropub")
    .auth(testToken(), { type: "bearer" })
    .set("accept", "application/json")
    .send({
      action: "delete",
      url: "https://website.example/foo",
    });

  t.is(result.status, 404);
  t.is(
    result.body.error_description,
    "No database record found for https://website.example/foo"
  );

  server.close(t);
});
