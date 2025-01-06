// src/routes/contact.routes.js
import express from "express";
import {
  createContactHandler,
  updateContactHandler,
  getContactsByLeadHandler,
  getContactByIdHandler,
  deleteContactHandler,
} from "../controllers/contact.controller.js";

import { validateRequest } from "../utils/validation/common.js";
import {
  createContactSchema,
  updateContactSchema,
} from "../utils/validation/contact.validation.js";

const router = express.Router();

// Validation middleware will validate the request before it reaches the handler
router.post("/", validateRequest(createContactSchema), createContactHandler);
router.patch(
  "/:id",
  validateRequest(updateContactSchema),
  updateContactHandler
);
router.get("/lead/:leadId", getContactsByLeadHandler);
router.get("/:id", getContactByIdHandler);
router.delete("/:id", deleteContactHandler);

export default router;
