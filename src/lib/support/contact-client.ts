// Admin call to save the contact channels (POST /api/admin/contact). Components use this, never raw fetch.
import { type AdminPostError, type AdminPostResult, postAdmin } from "../platform/admin-client";
import type { ContactSettings } from "./contact-contract";

export type ContactSaveError = AdminPostError;
export type ContactSaveResult = AdminPostResult;

export const saveContacts = (contacts: ContactSettings) => postAdmin("/api/admin/contact", contacts);
