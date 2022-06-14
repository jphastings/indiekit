import express from "express";
import multer from "multer";
import { fileController } from "./lib/controllers/file.js";
import { filesController } from "./lib/controllers/files.js";
import { uploadController } from "./lib/controllers/upload.js";
import { validate } from "./lib/middleware/validation.js";

const defaults = {
  mountPath: "/files",
};

export const FilesEndpoint = class {
  constructor(options = {}) {
    this.id = "endpoint-files";
    this.meta = import.meta;
    this.name = "File management endpoint";
    this.options = { ...defaults, ...options };
    this.mountPath = this.options.mountPath;
    this._router = express.Router(); // eslint-disable-line new-cap
  }

  navigationItems(application) {
    if (application.hasDatabase) {
      return {
        href: this.options.mountPath,
        text: "files.title",
      };
    }
  }

  get routes() {
    const router = this._router;
    const multipartParser = multer({
      storage: multer.memoryStorage(),
    });

    router.get("/", filesController);
    router.get("/new", uploadController.get);
    router.post(
      "/new",
      multipartParser.single("file"),
      validate,
      uploadController.post
    );
    router.get("/:id", fileController);

    return router;
  }

  init() {
    return true;
  }
};

export default FilesEndpoint;