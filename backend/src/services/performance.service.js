// services/performance.service.js
import { db } from "../db/index.js";
import { leads, leadPerformance, orderHistory } from "../db/schema/index.js";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { APIError, ERROR_CODES } from "../utils/error.utils.js";
import { DateTime } from "luxon";

export const PerformanceService = {
  async getLeadPerformance(leadId, context) {
    try {
      console.log("Fetching performance for lead:", leadId);

      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));

      if (!lead) {
        throw new APIError(
          `Lead not found with ID: ${leadId}`,
          404,
          ERROR_CODES.RESOURCE_NOT_FOUND
        );
      }

      const [performance] = await db
        .select()
        .from(leadPerformance)
        .where(eq(leadPerformance.leadId, leadId));

      const thirtyDaysAgo = DateTime.fromJSDate(context.currentTime)
        .minus({ days: 30 })
        .toJSDate();

      const orders = await db
        .select()
        .from(orderHistory)
        .where(
          and(
            eq(orderHistory.leadId, leadId),
            gte(orderHistory.orderDate, thirtyDaysAgo)
          )
        )
        .orderBy(desc(orderHistory.orderDate));

      if (!performance) {
        return {
          lead: {
            id: lead.id,
            name: lead.restaurantName,
            status: lead.status,
          },
          performance: {
            monthlyOrderCount: 0,
            lastOrderDate: null,
            averageOrderValue: 0,
            orderFrequency: "NEW",
            preferredOrderDays: [],
            performanceStatus: "NEW",
            lastStatusChange: null,
            orderTrend: "STABLE",
          },
          recentOrders: [],
        };
      }

      return {
        lead: {
          id: lead.id,
          name: lead.restaurantName,
          status: lead.status,
        },
        performance: {
          monthlyOrderCount: performance.monthlyOrderCount,
          lastOrderDate: performance.lastOrderDate,
          averageOrderValue: Number(performance.averageOrderValue),
          orderFrequency: performance.orderFrequency,
          preferredOrderDays: performance.preferredOrderDays,
          performanceStatus: performance.performanceStatus,
          lastStatusChange: performance.lastStatusChange,
          orderTrend: performance.orderTrend,
        },
        recentOrders: orders.map((order) => ({
          id: order.id,
          orderDate: order.orderDate,
          orderValue: Number(order.orderValue),
        })),
      };
    } catch (error) {
      console.error("Error in getLeadPerformance:", error);
      if (error instanceof APIError) throw error;
      throw new APIError(
        error.message || "Failed to fetch lead performance",
        error.status || 500,
        error.code || ERROR_CODES.DATABASE_ERROR
      );
    }
  },

  async updateOrderHistory(orderData, context) {
    try {
      console.log("Starting updateOrderHistory service:", {
        orderData,
        context,
      });

      return await db.transaction(async (trx) => {
        const [lead] = await trx
          .select()
          .from(leads)
          .where(eq(leads.id, orderData.leadId));

        if (!lead) {
          throw new APIError(
            `Lead not found with ID: ${orderData.leadId}`,
            404,
            ERROR_CODES.RESOURCE_NOT_FOUND
          );
        }

        const [newOrder] = await trx
          .insert(orderHistory)
          .values({
            leadId: orderData.leadId,
            orderValue: orderData.orderValue,
            orderDate: orderData.orderDate,
            createdAt: context.currentTime,
            updatedAt: context.currentTime,
          })
          .returning();

        console.log("Order inserted:", newOrder);

        const thirtyDaysAgo = DateTime.fromJSDate(context.currentTime)
          .minus({ days: 30 })
          .toJSDate();

        const orders = await trx
          .select()
          .from(orderHistory)
          .where(
            and(
              eq(orderHistory.leadId, orderData.leadId),
              gte(orderHistory.orderDate, thirtyDaysAgo)
            )
          )
          .orderBy(desc(orderHistory.orderDate));

        console.log("Found orders:", orders);

        const metrics = {
          monthlyOrderCount: orders.length,
          lastOrderDate: orders[0].orderDate,
          averageOrderValue:
            orders.reduce((sum, order) => sum + Number(order.orderValue), 0) /
            orders.length,
          orderFrequency: orders.length >= 2 ? "WEEKLY" : "MONTHLY",
          preferredOrderDays: [],
          performanceStatus: orders.length >= 2 ? "ACTIVE" : "STABLE",
          lastStatusChange: context.currentTime,
          orderTrend: "STABLE",
        };

        console.log("Calculated metrics:", metrics);

        const existingMetrics = await trx
          .select()
          .from(leadPerformance)
          .where(eq(leadPerformance.leadId, orderData.leadId));

        let updatedMetrics;

        if (existingMetrics.length > 0) {
          [updatedMetrics] = await trx
            .update(leadPerformance)
            .set({
              monthlyOrderCount: metrics.monthlyOrderCount,
              lastOrderDate: metrics.lastOrderDate,
              averageOrderValue: metrics.averageOrderValue,
              orderFrequency: metrics.orderFrequency,
              preferredOrderDays: metrics.preferredOrderDays,
              performanceStatus: metrics.performanceStatus,
              lastStatusChange: metrics.lastStatusChange,
              orderTrend: metrics.orderTrend,
              updatedAt: context.currentTime,
              updatedBy: "ravi-hisoka",
            })
            .where(eq(leadPerformance.leadId, orderData.leadId))
            .returning();
        } else {
          // Insert new metrics
          [updatedMetrics] = await trx
            .insert(leadPerformance)
            .values({
              leadId: orderData.leadId,
              monthlyOrderCount: metrics.monthlyOrderCount,
              lastOrderDate: metrics.lastOrderDate,
              averageOrderValue: metrics.averageOrderValue,
              orderFrequency: metrics.orderFrequency,
              preferredOrderDays: metrics.preferredOrderDays,
              performanceStatus: metrics.performanceStatus,
              lastStatusChange: metrics.lastStatusChange,
              orderTrend: metrics.orderTrend,
              createdAt: context.currentTime,
              createdBy: "ravi-hisoka",
              updatedAt: context.currentTime,
              updatedBy: "ravi-hisoka",
            })
            .returning();
        }

        console.log("Updated metrics:", updatedMetrics);

        return {
          leadId: orderData.leadId,
          metrics: {
            monthlyOrderCount: metrics.monthlyOrderCount,
            lastOrderDate: metrics.lastOrderDate,
            averageOrderValue: Number(metrics.averageOrderValue.toFixed(2)),
            orderFrequency: metrics.orderFrequency,
            preferredOrderDays: metrics.preferredOrderDays,
            performanceStatus: metrics.performanceStatus,
            lastStatusChange: metrics.lastStatusChange,
            orderTrend: metrics.orderTrend,
          },
          orderHistory: orders.map((order) => ({
            orderDate: order.orderDate,
            orderValue: Number(order.orderValue),
          })),
        };
      });
    } catch (error) {
      console.error("Service error:", error);
      throw new APIError(
        error.message || "Failed to update order history",
        error.status || 500,
        error.code || ERROR_CODES.DATABASE_ERROR
      );
    }
  },

  async getLeadsByPerformance(filters, context) {
    try {
      console.log("Processing getLeadsByPerformance:", { filters, context });

      let whereClause = undefined;
      if (filters.status) {
        whereClause = eq(leadPerformance.performanceStatus, filters.status);
      }

      let orderByColumn;
      switch (filters.orderBy) {
        case "monthlyOrderCount":
          orderByColumn = leadPerformance.monthlyOrderCount;
          break;
        case "lastOrderDate":
          orderByColumn = leadPerformance.lastOrderDate;
          break;
        case "averageOrderValue":
          orderByColumn = leadPerformance.averageOrderValue;
          break;
        default:
          orderByColumn = leadPerformance.monthlyOrderCount;
      }

      const performanceData = await db
        .select({
          leadId: leadPerformance.leadId,
          restaurantName: leads.restaurantName,
          status: leads.status,
          monthlyOrderCount: leadPerformance.monthlyOrderCount,
          lastOrderDate: leadPerformance.lastOrderDate,
          averageOrderValue: leadPerformance.averageOrderValue,
          orderFrequency: leadPerformance.orderFrequency,
          performanceStatus: leadPerformance.performanceStatus,
          orderTrend: leadPerformance.orderTrend,
        })
        .from(leadPerformance)
        .innerJoin(leads, eq(leads.id, leadPerformance.leadId))
        .where(whereClause)
        .orderBy(
          filters.sortOrder === "desc"
            ? desc(orderByColumn)
            : asc(orderByColumn)
        );

      console.log(`Found ${performanceData.length} leads matching criteria`);

      return {
        total: performanceData.length,
        filters: {
          status: filters.status || "ALL",
          orderBy: filters.orderBy,
          sortOrder: filters.sortOrder,
        },
        leads: performanceData.map((lead) => ({
          id: lead.leadId,
          restaurantName: lead.restaurantName,
          status: lead.status,
          performance: {
            monthlyOrderCount: lead.monthlyOrderCount,
            lastOrderDate: lead.lastOrderDate,
            averageOrderValue: Number(lead.averageOrderValue),
            orderFrequency: lead.orderFrequency,
            performanceStatus: lead.performanceStatus,
            orderTrend: lead.orderTrend,
          },
        })),
      };
    } catch (error) {
      console.error("Error in getLeadsByPerformance:", error);
      throw new APIError(
        error.message || "Failed to fetch leads by performance",
        error.status || 500,
        error.code || ERROR_CODES.DATABASE_ERROR
      );
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
