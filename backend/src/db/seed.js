import { db } from "./index.js";
import {
  users as usersTable,
  leads as leadsTable,
  contacts as contactsTable,
  interactions as interactionsTable,
  leadPerformance as leadPerformanceTable,
  orderHistory as orderHistoryTable,
} from "./schema/index.js";

async function seed() {
  const currentTime = new Date("2025-01-07T04:13:54Z");
  const currentUser = "ravi-hisoka";

  try {
    console.log("Starting seed process...");

    // 1. Insert Users
    console.log("Inserting users...");
    const insertedUsers = await db
      .insert(usersTable)
      .values([
        {
          email: "rwavi-hisoka@example.com",
          password: "BCpjMkfGV6TqwTi+riLh1xZrL7O2pHnjkYD51IxRggY",
          name: "Ravi",
          role: "kam",
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          email: "wjdwhn.doe@example.com",
          password: "BCpjMkfGV6TqwTi+riLh1xZrL7O2pHnjkYD51IxRggY=",
          name: "John Doe",
          role: "kam",
          createdAt: currentTime,
          updatedAt: currentTime,
        },
      ])
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
      });

    const [user1, user2] = insertedUsers;
    console.log("Inserted users:", insertedUsers);

    if (!user1?.id || !user2?.id) {
      throw new Error("Failed to get user IDs after insertion");
    }

    // 2. Insert Leads
    console.log("Inserting leads...");
    const insertedLeads = await db
      .insert(leadsTable)
      .values([
        {
          userId: user1.id,
          restaurantName: "Tasty Bites London",
          address: "123 Food Street, London, UK",
          status: "CONVERTED",
          restaurantType: "FINE_DINING",
          notes: "Premium client - UTC timezone",
          timezone: "UTC",
          callFrequency: "WEEKLY",
          lastCallDate: new Date("2025-01-05T10:00:00Z"),
          nextCallDate: new Date("2025-01-12T10:00:00Z"),
          businessHoursStart: "09:00",
          businessHoursEnd: "22:00",
          preferredCallDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          userId: user1.id,
          restaurantName: "Mumbai Spice House",
          address: "456 Curry Lane, Mumbai, India",
          status: "INTERESTED",
          restaurantType: "FINE_DINING",
          notes: "Potential client - IST timezone (UTC+5:30)",
          timezone: "Asia/Kolkata",
          callFrequency: "BIWEEKLY",
          lastCallDate: new Date("2025-01-06T08:30:00Z"),
          nextCallDate: new Date("2025-01-20T08:30:00Z"),
          businessHoursStart: "10:00",
          businessHoursEnd: "22:00",
          preferredCallDays: ["TUESDAY", "THURSDAY"],
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          userId: user2.id,
          restaurantName: "SF Gourmet Delights",
          address: "789 Tech Ave, San Francisco, USA",
          status: "NEGOTIATING",
          restaurantType: "CASUAL_DINING",
          notes: "Tech district client - PST timezone (UTC-8)",
          timezone: "America/Los_Angeles",
          callFrequency: "WEEKLY",
          lastCallDate: new Date("2025-01-06T18:00:00Z"),
          nextCallDate: new Date("2025-01-13T18:00:00Z"),
          businessHoursStart: "08:00",
          businessHoursEnd: "21:00",
          preferredCallDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          userId: user2.id,
          restaurantName: "Delhi Street Kitchen",
          address: "101 Food Court, Delhi, India",
          status: "INTERESTED",
          restaurantType: "QSR",
          notes: "Fast-growing chain - IST timezone (UTC+5:30)",
          timezone: "Asia/Kolkata",
          callFrequency: "WEEKLY",
          lastCallDate: new Date("2025-01-06T05:30:00Z"),
          nextCallDate: new Date("2025-01-13T05:30:00Z"),
          businessHoursStart: "09:00",
          businessHoursEnd: "23:00",
          preferredCallDays: ["TUESDAY", "THURSDAY", "SATURDAY"],
          createdAt: currentTime,
          updatedAt: currentTime,
        },
      ])
      .returning({
        id: leadsTable.id,
        restaurantName: leadsTable.restaurantName,
        timezone: leadsTable.timezone,
      });

    console.log("Inserted leads:", insertedLeads);

    // 3. Insert Contacts
    console.log("Inserting contacts...");
    const insertedContacts = await db
      .insert(contactsTable)
      .values([
        {
          leadId: insertedLeads[0].id,
          name: "James Wilson",
          role: "Restaurant Manager",
          phone: "+44-20-1234-5678",
          email: "james@tastybites.uk",
          isPrimary: true,
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          leadId: insertedLeads[1].id,
          name: "Priya Sharma",
          role: "Owner",
          phone: "+91-98765-43210",
          email: "priya@mumbaispice.in",
          isPrimary: true,
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          leadId: insertedLeads[2].id,
          name: "Mike Chen",
          role: "Head Chef",
          phone: "+1-415-555-0123",
          email: "mike@sfgourmet.com",
          isPrimary: true,
          createdAt: currentTime,
          updatedAt: currentTime,
        },
        {
          leadId: insertedLeads[3].id,
          name: "Rajesh Kumar",
          role: "Operations Manager",
          phone: "+91-99999-88888",
          email: "rajesh@delhikitchen.in",
          isPrimary: true,
          createdAt: currentTime,
          updatedAt: currentTime,
        },
      ])
      .returning({
        id: contactsTable.id,
        name: contactsTable.name,
        leadId: contactsTable.leadId,
      });

    console.log("Inserted contacts:", insertedContacts);

    // 4. Insert Interactions
    console.log("Inserting interactions...");
    const insertedInteractions = await db
      .insert(interactionsTable)
      .values([
        {
          leadId: insertedLeads[0].id,
          contactId: insertedContacts[0].id,
          userId: user1.id,
          type: "CALL",
          status: "COMPLETED",
          details: "Weekly review - Discussed weekend specials",
          orderAmount: "0",
          orderItems: {},
          createdBy: user1.id,
          createdAt: new Date("2025-01-05T10:00:00Z"),
          updatedAt: new Date("2025-01-05T10:00:00Z"),
        },
        {
          leadId: insertedLeads[1].id,
          contactId: insertedContacts[1].id,
          userId: user1.id,
          type: "CALL",
          status: "FOLLOW_UP_NEEDED",
          details: "Interested in bulk orders for events",
          orderAmount: "0",
          orderItems: {},
          createdBy: user1.id,
          createdAt: new Date("2025-01-06T08:30:00Z"),
          updatedAt: new Date("2025-01-06T08:30:00Z"),
        },
        {
          leadId: insertedLeads[2].id,
          contactId: insertedContacts[2].id,
          userId: user2.id,
          type: "CALL",
          status: "COMPLETED",
          details: "Menu planning for tech company catering",
          orderAmount: "0",
          orderItems: {},
          createdBy: user2.id,
          createdAt: new Date("2025-01-06T18:00:00Z"),
          updatedAt: new Date("2025-01-06T18:00:00Z"),
        },
      ])
      .returning({
        id: interactionsTable.id,
        leadId: interactionsTable.leadId,
        type: interactionsTable.type,
      });

    console.log("Inserted interactions:", insertedInteractions);

    // 5. Insert Lead Performance
    console.log("Inserting lead performance...");
    const insertedPerformance = await db
      .insert(leadPerformanceTable)
      .values([
        {
          leadId: insertedLeads[0].id,
          monthlyOrderCount: 4,
          lastOrderDate: new Date("2025-01-06T15:00:00Z"),
          averageOrderValue: "2250.0",
          orderFrequency: "WEEKLY",
          preferredOrderDays: ["MONDAY", "THURSDAY"],
          performanceStatus: "HIGH_PERFORMING",
          lastStatusChange: new Date("2025-01-01T00:00:00Z"),
          orderTrend: "INCREASING",
          createdAt: currentTime,
          createdBy: currentUser,
          updatedAt: currentTime,
          updatedBy: currentUser,
        },
        {
          leadId: insertedLeads[1].id,
          monthlyOrderCount: 1,
          lastOrderDate: new Date("2025-01-03T12:00:00Z"),
          averageOrderValue: "1500.0",
          orderFrequency: "MONTHLY",
          preferredOrderDays: ["WEDNESDAY"],
          performanceStatus: "STABLE",
          lastStatusChange: new Date("2025-01-01T00:00:00Z"),
          orderTrend: "STABLE",
          createdAt: currentTime,
          createdBy: currentUser,
          updatedAt: currentTime,
          updatedBy: currentUser,
        },
        {
          leadId: insertedLeads[2].id,
          monthlyOrderCount: 2,
          lastOrderDate: new Date("2025-01-05T20:00:00Z"),
          averageOrderValue: "3000.0",
          orderFrequency: "BIWEEKLY",
          preferredOrderDays: ["MONDAY", "FRIDAY"],
          performanceStatus: "HIGH_PERFORMING",
          lastStatusChange: new Date("2025-01-01T00:00:00Z"),
          orderTrend: "INCREASING",
          createdAt: currentTime,
          createdBy: currentUser,
          updatedAt: currentTime,
          updatedBy: currentUser,
        },
      ])
      .returning({
        id: leadPerformanceTable.id,
        leadId: leadPerformanceTable.leadId,
        performanceStatus: leadPerformanceTable.performanceStatus,
      });

    console.log("Inserted performance:", insertedPerformance);

    // 6. Insert Order History
    console.log("Inserting order history...");
    const insertedOrders = await db
      .insert(orderHistoryTable)
      .values([
        {
          leadId: insertedLeads[0].id,
          orderValue: "2500.0",
          orderDate: new Date("2025-01-06T15:00:00Z"),
          createdAt: new Date("2025-01-06T15:00:00Z"),
          updatedAt: new Date("2025-01-06T15:00:00Z"),
        },
        {
          leadId: insertedLeads[0].id,
          orderValue: "2000.0",
          orderDate: new Date("2025-01-01T10:00:00Z"),
          createdAt: new Date("2025-01-01T10:00:00Z"),
          updatedAt: new Date("2025-01-01T10:00:00Z"),
        },
        {
          leadId: insertedLeads[1].id,
          orderValue: "1500.0",
          orderDate: new Date("2025-01-03T12:00:00Z"),
          createdAt: new Date("2025-01-03T12:00:00Z"),
          updatedAt: new Date("2025-01-03T12:00:00Z"),
        },
        {
          leadId: insertedLeads[2].id,
          orderValue: "3000.0",
          orderDate: new Date("2025-01-05T20:00:00Z"),
          createdAt: new Date("2025-01-05T20:00:00Z"),
          updatedAt: new Date("2025-01-05T20:00:00Z"),
        },
      ])
      .returning({
        id: orderHistoryTable.id,
        leadId: orderHistoryTable.leadId,
        orderValue: orderHistoryTable.orderValue,
      });

    console.log("Inserted orders:", insertedOrders);
    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Detailed error:", error);
    throw error;
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
