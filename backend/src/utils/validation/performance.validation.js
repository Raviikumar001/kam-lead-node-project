// utils/validation/performance.validation.js
import { z } from "zod";
import { performanceStatusEnum } from "../../db/schema/index.js";

export const performanceValidation = {
  leadId: z.object({
    leadId: z.number({
      required_error: "Lead ID is required",
      invalid_type_error: "Lead ID must be a number",
    }),
  }),

  getPerformanceMetrics: z.object({
    status: z.enum(performanceStatusEnum.enumValues).optional(),
    orderBy: z
      .enum(["monthlyOrderCount", "lastOrderDate", "averageOrderValue"])
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  }),

  updateOrderHistory: z
    .object({
      leadId: z.number(),
      orderValue: z.number().positive("Order value must be positive"),
      orderDate: z.date(),
    })
    .refine(
      (data) => {
        return new Date(data.orderDate) <= new Date();
      },
      {
        message: "Order date cannot be in the future",
      }
    ),
};
