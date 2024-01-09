import YAML from "yaml";

export default class JekyllPreset {
  constructor() {
    this.id = "jekyll";
    this.meta = import.meta;
    this.name = "Jekyll preset";
  }

  get info() {
    return {
      name: "Jekyll",
    };
  }

  /**
   * Post types
   * @returns {object} Post types configuration
   */
  get postTypes() {
    return [
      {
        type: "article",
        post: {
          path: "_posts/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      {
        type: "note",
        post: {
          path: "_notes/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "notes/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "photo",
        post: {
          path: "_photos/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "photos/{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/photos/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      {
        type: "video",
        post: {
          path: "_videos/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "videos/{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/videos/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      {
        type: "audio",
        post: {
          path: "_audio/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "audio/{yyyy}/{MM}/{dd}/{slug}",
        },
        media: {
          path: "media/audio/{yyyy}/{MM}/{dd}/{filename}",
        },
      },
      {
        type: "bookmark",
        post: {
          path: "_bookmarks/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "bookmarks/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "checkin",
        post: {
          path: "_checkins/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "checkins/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "event",
        post: {
          path: "_events/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "events/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "rsvp",
        post: {
          path: "_replies/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "replies/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "reply",
        post: {
          path: "_replies/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "replies/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "repost",
        post: {
          path: "_reposts/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "reposts/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
      {
        type: "like",
        post: {
          path: "_likes/{yyyy}-{MM}-{dd}-{slug}.md",
          url: "likes/{yyyy}/{MM}/{dd}/{slug}",
        },
      },
    ];
  }

  /**
   * Post template
   * @param {object} properties - JF2 properties
   * @returns {string} Rendered template
   */
  postTemplate(properties) {
    let content;
    if (properties.content) {
      content =
        properties.content.text ||
        properties.content.html ||
        properties.content;
      content = `\n${content}\n`;
    } else {
      content = "";
    }

    properties = {
      date: properties.published,
      ...(properties.updated && { updated: properties.updated }),
      ...(properties.deleted && { deleted: properties.deleted }),
      ...(properties.name && { title: properties.name }),
      ...(properties.summary && { excerpt: properties.summary }),
      ...(properties.category && { category: properties.category }),
      ...(properties.start && { start: properties.start }),
      ...(properties.end && { end: properties.end }),
      ...(properties.rsvp && { rsvp: properties.rsvp }),
      ...(properties.location && { location: properties.location }),
      ...(properties.checkin && { checkin: properties.checkin }),
      ...(properties.audio && { audio: properties.audio }),
      ...(properties.photo && { photo: properties.photo }),
      ...(properties.video && { video: properties.video }),
      ...(properties["bookmark-of"] && {
        "bookmark-of": properties["bookmark-of"],
      }),
      ...(properties["like-of"] && { "like-of": properties["like-of"] }),
      ...(properties["repost-of"] && { "repost-of": properties["repost-of"] }),
      ...(properties["in-reply-to"] && {
        "in-reply-to": properties["in-reply-to"],
      }),
      ...(properties["post-status"] === "draft" && { published: false }),
      ...(properties.visibility && { visibility: properties.visibility }),
      ...(properties.syndication && { syndication: properties.syndication }),
      ...(properties.references && { references: properties.references }),
    };
    let frontMatter = YAML.stringify(properties, { lineWidth: 0 });
    frontMatter = `---\n${frontMatter}---\n`;

    return frontMatter + content;
  }

  init(Indiekit) {
    Indiekit.addPreset(this);
  }
}
