import express from "express";
import {
  createIPX,
  ipxFSStorage,
  ipxHttpStorage,
  createIPXNodeServer,
} from "ipx";

const defaults = { me: "", mountPath: "/image" };
const router = express.Router(); // eslint-disable-line new-cap

export default class ImageEndpoint {
  constructor(options = {}) {
    this.id = "endpoint-image";
    this.meta = import.meta;
    this.name = "Image resizing endpoint";
    this.options = { ...defaults, ...options };
    this.mountPath = this.options.mountPath;
  }

  get routesPublic() {
    const ipx = createIPX({
      storage: ipxFSStorage({ dir: "./public" }),
      httpStorage: ipxHttpStorage({ domains: this.options.me }),
    });

    router.use(createIPXNodeServer(ipx));

    return router;
  }

  init(Indiekit) {
    Indiekit.addEndpoint(this);
    Indiekit.config.application.imageEndpoint = this.options.mountPath;
  }
}
