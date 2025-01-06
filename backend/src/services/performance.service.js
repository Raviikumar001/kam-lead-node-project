// services/performance.service.js
import { db } from "../db/index.js";
import { leads, leadPerformance, orderHistory } from "../db/schema/index.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { APIError } from "../utils/error.utils.js";

export const PerformanceService = {
  async getLeadPerformance(leadId, context) {
    try {
      const performance = await db.query.leadPerformance.findFirst({
        where: eq(leadPerformance.leadId, leadId),
        with: {
          lead: true,
        },
      });

      if (!performance) {
        throw new APIError({
          message: `No performance data found for lead ${leadId}`,
          statusCode: 404,
        });
      }

      return performance;
    } catch (error) {
      if (error instanceof APIError) throw error;
      throw new APIError({
        message: "Failed to fetch lead performance",
        statusCode: 500,
        cause: error,
      });
    }
  },

  async getLeadsByPerformance(params, context) {
    try {
      let query = db
        .select()
        .from(leadPerformance)
        .innerJoin(leads, eq(leads.id, leadPerformance.leadId));

      if (params.status) {
        query = query.where(
          eq(leadPerformance.performanceStatus, params.status)
        );
      }

      if (params.orderBy) {
        const orderFunc = params.sortOrder === "asc" ? asc : desc;
        query = query.orderBy(orderFunc(leadPerformance[params.orderBy]));
      }

      return await query;
    } catch (error) {
      throw new APIError({
        message: "Failed to fetch leads by performance",
        statusCode: 500,
        cause: error,
      });
    }
  },

  async updateOrderHistory(data, context) {
    try {
      return await db.transaction(async (trx) => {
        await trx.insert(orderHistory).values({
          ...data,
          createdAt: context.currentTime,
          createdBy: context.currentUser,
          updatedAt: context.currentTime,
          updatedBy: context.currentUser,
        });

        await this.updatePerformanceMetrics(data.leadId, trx, context);

        return await this.getLeadPerformance(data.leadId, context);
      });
    } catch (error) {
      throw new APIError({
        message: "Failed to update order history",
        statusCode: 500,
        cause: error,
      });
    }
  },

  async updatePerformanceMetrics(leadId, trx, context) {
    const thirtyDaysAgo = new Date(context.currentTime);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await trx
      .select()
      .from(orderHistory)
      .where(
        and(
          eq(orderHistory.leadId, leadId),
          gte(orderHistory.orderDate, thirtyDaysAgo)
        )
      );

    const monthlyOrderCount = recentOrders.length;
    const totalValue = recentOrders.reduce(
      (sum, order) => sum + Number(order.orderValue),
      0
    );
    const averageOrderValue =
      monthlyOrderCount > 0 ? totalValue / monthlyOrderCount : 0;

    const performanceStatus = this.calculatePerformanceStatus({
      monthlyOrderCount,
      averageOrderValue,
      lastOrderDate: recentOrders[0]?.orderDate || null,
      context,
    });

    await trx
      .update(leadPerformance)
      .set({
        monthlyOrderCount,
        averageOrderValue,
        performanceStatus,
        lastOrderDate: recentOrders[0]?.orderDate || null,
        updatedAt: context.currentTime,
        updatedBy: context.currentUser,
      })
      .where(eq(leadPerformance.leadId, leadId));
  },

  calculatePerformanceStatus({
    monthlyOrderCount,
    averageOrderValue,
    lastOrderDate,
    context,
  }) {
    if (!lastOrderDate) return "UNDERPERFORMING";

    const daysSinceLastOrder = Math.floor(
      (context.currentTime.getTime() - lastOrderDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (monthlyOrderCount >= 4 && daysSinceLastOrder <= 30) {
      return "HIGH_PERFORMING";
    } else if (monthlyOrderCount >= 2 && daysSinceLastOrder <= 60) {
      return "STABLE";
    } else if (daysSinceLastOrder <= 90) {
      return "NEEDS_ATTENTION";
    } else {
      return "UNDERPERFORMING";
    }
  },
};
