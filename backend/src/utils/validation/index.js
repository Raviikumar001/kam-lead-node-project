// src/utils/validation/index.js
export { validateRequest } from "./common.js";
export { loginSchema, registerSchema } from "./auth.validation.js";
export { createLeadSchema, updateLeadSchema } from "./lead.validation.js";
export { createInteractionSchema } from "./interaction.validation.js";
export {
  createContactSchema,
  updateContactSchema,
} from "./contact.validation.js";
