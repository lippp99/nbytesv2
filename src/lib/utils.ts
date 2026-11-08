import { createCn } from "cn/config";

// Teach the class merger our custom tokens from globals.css. Without this it reads `text-ui` as a colour and
// drops `text-primary-foreground` next to it (the header button rendered ink text on an ink fill).
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h2", "h3", "lead", "body", "ui", "nav", "code", "label"] }],
      rounded: [{ rounded: ["card", "panel", "chip", "bar"] }],
      shadow: [{ shadow: ["press", "press-hover", "coin"] }],
    },
  },
});
