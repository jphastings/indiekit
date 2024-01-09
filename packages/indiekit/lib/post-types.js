import _ from "lodash";

/**
 * Get merged preset and custom post types
 * @param {object} publication - Publication configuration
 * @param {Array[object]} publication.postTypes - Publication post types
 * @param {object} [publication.preset] - Publication preset
 * @returns {object} Merged configuration
 */
export const getPostTypes = ({ postTypes, preset }) => {
  postTypes = _.keyBy(postTypes, "type");

  if (preset?.postTypes) {
    const presetPostTypes = _.keyBy(preset.postTypes, "type");

    postTypes = _.merge(postTypes, presetPostTypes);
  }

  return _.values(postTypes);
};
