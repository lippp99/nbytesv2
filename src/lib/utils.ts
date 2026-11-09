import { createCn } from "cn/config";

// Teach the class merger our custom tokens from globals.css. Without this it reads `text-ui` as a colour and
// drops `text-primary-foreground` next to it (the header button rendered ink text on an ink fill).
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "h2", "h3", "lead", "body", "ui", "nav", "code", "label"] },
        // dashboard type scale (.claude/rules/dashboard-design.md)
        { text: ["app-title", "app-section", "app-card", "app-body", "app-ui", "app-small", "app-code"] },
      ],
      rounded: [{ rounded: ["card", "panel", "chip", "bar", "app-card", "app-control", "app-code", "app-inner"] }],
      shadow: [{ shadow: ["press", "press-hover", "coin", "app-raised"] }],
    },
  },
});
