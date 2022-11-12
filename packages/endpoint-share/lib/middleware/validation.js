import { check } from "express-validator";

export const validate = [
  check("name")
    .notEmpty()
    .withMessage((value, { req, path }) => req.__(`share.error.${path}`)),
  check("bookmark-of")
    .exists()
    .isURL()
    .withMessage((value, { req, path }) => req.__(`share.error.${path}`)),
];
