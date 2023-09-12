import process from "node:process";
import bitbucket from "bitbucket";
import { IndiekitError } from "@indiekit/error";

const defaults = {
  branch: "main",
  password: process.env.BITBUCKET_PASSWORD,
};

/**
 * @typedef {import("bitbucket").APIClient} APIClient
 */
export default class BitbucketStore {
  /**
   * @param {object} [options] - Plug-in options
   * @param {string} [options.user] - Username
   * @param {string} [options.repo] - Repository
   * @param {string} [options.branch] - Branch
   * @param {string} [options.password] - Password
   */
  constructor(options = {}) {
    this.id = "bitbucket";
    this.meta = import.meta;
    this.name = "Bitbucket store";
    this.options = { ...defaults, ...options };
  }

  get environment() {
    return ["BITBUCKET_PASSWORD"];
  }

  get info() {
    const { repo, user } = this.options;

    return {
      name: `${user}/${repo} on Bitbucket`,
      uid: `https://bitbucket.org/${user}/${repo}`,
    };
  }

  get prompts() {
    return [
      {
        type: "text",
        name: "user",
        message: "What is your Bitbucket username?",
      },
      {
        type: "text",
        name: "repo",
        message: "Which repository is your publication stored on?",
      },
      {
        type: "text",
        name: "branch",
        message: "Which branch are you publishing from?",
        initial: defaults.branch,
      },
    ];
  }

  /**
   * @access private
   * @returns {APIClient} Bitbucket client interface
   */
  get #client() {
    const { Bitbucket } = bitbucket;
    return new Bitbucket({
      auth: {
        username: this.options.user,
        password: this.options.password,
      },
      notice: false,
    });
  }

  /**
   * Create file
   * @param {string} filePath - Path to file
   * @param {string} content - File content
   * @param {object} options - Options
   * @param {string} options.message - Commit message
   * @returns {Promise<boolean>} File created
   * @see {@link https://bitbucketjs.netlify.app/#api-repositories-repositories_createSrcFileCommit}
   */
  async createFile(filePath, content, { message }) {
    try {
      await this.#client.repositories.createSrcFileCommit({
        [filePath]: content,
        branch: this.options.branch,
        message,
        repo_slug: this.options.repo,
        workspace: this.options.user,
      });

      return true;
    } catch (error) {
      throw new IndiekitError(error.message, {
        cause: error,
        plugin: this.name,
        status: error.status,
      });
    }
  }

  /**
   * Read file
   * @param {string} filePath - Path to file
   * @returns {Promise<string>} File content
   * @see {@link https://bitbucketjs.netlify.app/#api-repositories-repositories_readSrc}
   */
  async readFile(filePath) {
    try {
      const response = await this.#client.repositories.readSrc({
        format: "rendered",
        commit: this.options.branch,
        path: filePath,
        repo_slug: this.options.repo,
        workspace: this.options.user,
      });
      const content = response.data.raw;

      return content;
    } catch (error) {
      throw new IndiekitError(error.message, {
        cause: error,
        plugin: this.name,
        status: error.status,
      });
    }
  }

  /**
   * Update file
   * @param {string} filePath - Path to file
   * @param {string} content - File content
   * @param {object} options - Options
   * @param {string} options.message - Commit message
   * @param {string} options.newPath - New path to file
   * @returns {Promise<boolean>} File updated
   * @see {@link https://bitbucketjs.netlify.app/#api-repositories-repositories_createSrcFileCommit}
   */
  async updateFile(filePath, content, { message, newPath }) {
    try {
      const updateFilePath = newPath || filePath;
      await this.#client.repositories.createSrcFileCommit({
        [updateFilePath]: content,
        branch: this.options.branch,
        message,
        repo_slug: this.options.repo,
        workspace: this.options.user,
      });

      if (newPath) {
        await this.deleteFile(filePath, { message });
      }

      return true;
    } catch (error) {
      throw new IndiekitError(error.message, {
        cause: error,
        plugin: this.name,
        status: error.status,
      });
    }
  }

  /**
   * Delete file
   * @param {string} filePath - Path to file
   * @param {object} options - Options
   * @param {string} options.message - Commit message
   * @returns {Promise<boolean>} File deleted
   * @see {@link https://bitbucketjs.netlify.app/#api-repositories-repositories_createSrcFileCommit}
   */
  async deleteFile(filePath, { message }) {
    try {
      await this.#client.repositories.createSrcFileCommit({
        branch: this.options.branch,
        files: filePath,
        message,
        repo_slug: this.options.repo,
        workspace: this.options.user,
      });

      return true;
    } catch (error) {
      throw new IndiekitError(error.message, {
        cause: error,
        plugin: this.name,
        status: error.status,
      });
    }
  }

  init(Indiekit) {
    Indiekit.addStore(this);
  }
}
