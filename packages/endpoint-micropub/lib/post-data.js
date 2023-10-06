import util from "node:util";
import { IndiekitError } from "@indiekit/error";
import { getCanonicalUrl, getDate } from "@indiekit/util";
import { getPostType } from "./post-type-discovery.js";
import { getSyndicateToProperty, normaliseProperties } from "./jf2.js";
import * as updateMf2 from "./update.js";
import { getPostTypeConfig, renderPath } from "./utils.js";

export const postData = {
  /**
   * Create post data
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {object} properties - JF2 properties
   * @param {boolean} [draftMode] - Draft mode
   * @returns {Promise<object>} Post data
   */
  async create(application, publication, properties, draftMode = false) {
    const { hasDatabase, posts, timeZone } = application;
    const { me, postTypes, syndicationTargets } = publication;

    // Add syndication targets
    const syndicateTo = getSyndicateToProperty(properties, syndicationTargets);
    if (syndicateTo) {
      properties["mp-syndicate-to"] = syndicateTo;
    }

    // Normalise properties
    properties = normaliseProperties(publication, properties, timeZone);

    // Post type
    const type = getPostType(properties);
    properties["post-type"] = type;

    // Get post type configuration
    const typeConfig = getPostTypeConfig(type, postTypes);
    if (!typeConfig) {
      throw IndiekitError.notImplemented(type);
    }

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application,
    );
    const url = await renderPath(typeConfig.post.url, properties, application);
    properties.url = getCanonicalUrl(url, me);

    // Post status
    // Draft mode: Only create post with a `draft` post-status
    properties["post-status"] = draftMode
      ? "draft"
      : properties["post-status"] || "published";

    const postData = { storeProperties: { path }, properties };

    // Add data to posts collection (if present)
    if (hasDatabase) {
      await posts.insertOne(postData);
    }

    return postData;
  },

  /**
   * Read post data
   * @param {object} application - Application configuration
   * @param {string} url - URL of existing post
   * @returns {Promise<object>} Post data
   */
  async read(application, url) {
    const { posts } = application;
    const query = { "properties.url": url };

    const postData = await posts.findOne(query);
    if (!postData) {
      throw IndiekitError.notFound(url);
    }

    return postData;
  },

  /**
   * Update post data
   *
   * Add, delete or replace properties and/or replace property values
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {string} url - URL of existing post
   * @param {object} operation - Requested operation(s)
   * @returns {Promise<object>} Post data
   */
  async update(application, publication, url, operation) {
    const { posts, timeZone } = application;
    const { me, postTypes } = publication;

    // Read properties
    let { storeProperties, properties } = await this.read(application, url);

    // Save incoming properties for later comparison
    const _originalPath = storeProperties.path;
    const _originalProperties = structuredClone(properties);

    // Add properties
    if (operation.add) {
      properties = updateMf2.addProperties(properties, operation.add);
    }

    // Replace property entries
    if (operation.replace) {
      properties = await updateMf2.replaceEntries(
        properties,
        operation.replace,
      );
    }

    // Remove properties and/or property entries
    if (operation.delete) {
      properties = Array.isArray(operation.delete)
        ? updateMf2.deleteProperties(properties, operation.delete)
        : updateMf2.deleteEntries(properties, operation.delete);
    }

    // Normalise properties
    properties = normaliseProperties(publication, properties, timeZone);

    // Post type
    const type = getPostType(properties);
    const typeConfig = getPostTypeConfig(type, postTypes);
    properties["post-type"] = type;

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application,
    );
    const updatedUrl = await renderPath(
      typeConfig.post.url,
      properties,
      application,
    );
    properties.url = getCanonicalUrl(updatedUrl, me);

    // Return if no changes to properties detected
    if (util.isDeepStrictEqual(properties, _originalProperties)) {
      return;
    }

    // Add updated date
    properties.updated = getDate(timeZone);

    // Update data in posts collection
    const query = { "properties.url": url };
    const update = {
      $set: {
        properties,
        "storeProperties._originalPath": _originalPath,
        "storeProperties.path": path,
      },
    };
    const { value: postData } = await posts.findOneAndUpdate(query, update, {
      returnDocument: "after",
    });

    return postData;
  },

  /**
   * Delete post data
   *
   * Delete (most) properties, keeping a record of deleted for later retrieval
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {string} url - URL of existing post
   * @returns {Promise<object>} Post data
   */
  async delete(application, publication, url) {
    const { posts, timeZone } = application;
    const { postTypes } = publication;

    // Read properties
    const { properties } = await this.read(application, url);

    // Make a copy of existing properties
    const _deletedProperties = structuredClone(properties);

    // Delete all properties, except those required for path creation
    for (const key in _deletedProperties) {
      if (!["mp-slug", "post-type", "published", "type", "url"].includes(key)) {
        delete properties[key];
      }
    }

    // Add deleted date
    properties.deleted = getDate(timeZone);

    // Post type
    const typeConfig = getPostTypeConfig(properties["post-type"], postTypes);

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application,
    );

    // Update data in posts collection
    const query = { "properties.url": url };
    const update = {
      $set: {
        _deletedProperties,
        properties,
        "storeProperties.path": path,
      },
    };
    const { value: postData } = await posts.findOneAndUpdate(query, update, {
      returnDocument: "after",
    });

    return postData;
  },

  /**
   * Undelete post data
   *
   * Restore previously deleted properties
   * @param {object} application - Application configuration
   * @param {object} publication - Publication configuration
   * @param {string} url - URL of existing post
   * @param {boolean} [draftMode] - Draft mode
   * @returns {Promise<object>} Post data
   */
  async undelete(application, publication, url, draftMode) {
    const { posts } = application;
    const { postTypes } = publication;

    // Read deleted properties
    const { _deletedProperties } = await this.read(application, url);

    // Restore previously deleted properties
    const properties = _deletedProperties;

    // Post type
    const typeConfig = getPostTypeConfig(properties["post-type"], postTypes);

    // Post paths
    const path = await renderPath(
      typeConfig.post.path,
      properties,
      application,
    );

    // Post status
    // Draft mode: Only restore post with a `draft` post-status
    properties["post-status"] = draftMode
      ? "draft"
      : properties["post-status"] || "published";

    // Update data in posts collection
    const query = { "properties.url": url };
    const update = {
      $set: {
        properties,
        "storeProperties.path": path,
      },
      $unset: {
        _deletedProperties: "",
      },
    };
    const { value: postData } = await posts.findOneAndUpdate(query, update, {
      returnDocument: "after",
    });

    return postData;
  },
};
