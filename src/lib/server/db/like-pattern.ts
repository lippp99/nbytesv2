import "server-only";

/** LIKE pattern for a literal search text: %, _ and \ in the text match only themselves. */
export const likeContains = (text: string) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
