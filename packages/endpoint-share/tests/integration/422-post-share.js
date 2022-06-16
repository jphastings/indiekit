import test from "ava";
import { JSDOM } from "jsdom";
import { testServer } from "@indiekit-test/server";
import { cookie } from "@indiekit-test/session";

test("Returns 422 invalid form submission", async (t) => {
  const request = await testServer();
  const response = await request.post("/share").set("cookie", [cookie]);
  const dom = new JSDOM(response.text);
  const result = dom.window.document;

  t.is(response.status, 422);
  t.is(
    result.querySelector("title").textContent,
    "Error: Share - Test configuration"
  );
  t.is(
    result.querySelector("#name-error .error-message__text").textContent,
    "Enter a title"
  );
  t.is(
    result.querySelector("#bookmark-of-error .error-message__text").textContent,
    "Invalid value"
  );
});