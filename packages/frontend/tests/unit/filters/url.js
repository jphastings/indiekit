import test from "ava";
import { friendlyUrl, imageUrl } from "../../../lib/filters/index.js";

test("Gets friendly URL", (t) => {
  t.is(friendlyUrl("https://website.example/path"), "website.example/path");
});

test("Gets image URL", (t) => {
  const application = {
    imageEndpoint: "/image",
    url: "https://server.example",
  };
  const result = imageUrl("/path/to/image.jpg", application);
  t.is(result, "https://server.example/image/_/%2Fpath%2Fto%2Fimage.jpg");
});

test("Gets transformed image URL", (t) => {
  const application = {
    imageEndpoint: "/image",
    url: "https://server.example",
  };
  const result = imageUrl("/path/to/image.jpg", application, {
    width: 100,
    height: 100,
    fit: "contain",
  });
  t.is(
    result,
    "https://server.example/image/s_100x100,fit_contain/%2Fpath%2Fto%2Fimage.jpg",
  );
});
