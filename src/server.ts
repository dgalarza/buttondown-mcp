import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ButtondownClient } from "./client.js";
import { getApiKey, jsonResponse } from "./utils.js";

export function createServer() {
  const server = new McpServer({
    name: "buttondown",
    version: "1.0.0",
  });

  // list_emails tool
  server.tool(
    "list_emails",
    "List emails from your Buttondown newsletter. Filter by status (draft, scheduled, sent, etc.)",
    {
      status: z
        .enum([
          "draft",
          "scheduled",
          "sent",
          "about_to_send",
          "in_flight",
          "deleted",
        ])
        .optional()
        .describe("Filter emails by status"),
      page: z.number().optional().describe("Page number for pagination"),
    },
    async ({ status, page }) => {
      const client = new ButtondownClient(getApiKey());
      const response = await client.listEmails(status, page);
      return jsonResponse(response);
    }
  );

  // get_email tool
  server.tool(
    "get_email",
    "Get detailed information about a specific email",
    {
      id: z.string().describe("The email ID (e.g., em_29fxqcmrkp969vzttksexvmvr8)"),
    },
    async ({ id }) => {
      const client = new ButtondownClient(getApiKey());
      const email = await client.getEmail(id);
      return jsonResponse(email);
    }
  );

  // create_draft tool
  server.tool(
    "create_draft",
    "Create a new draft email with markdown content",
    {
      subject: z.string().describe("The email subject line"),
      body: z.string().describe("The email body content (supports markdown)"),
      description: z
        .string()
        .optional()
        .describe("A description for the email (used in archives/SEO)"),
      slug: z.string().optional().describe("Custom URL slug for the email"),
      email_type: z
        .enum(["public", "private", "premium"])
        .optional()
        .describe("Audience type: public (all), private (subscribers only), premium (paid only)"),
    },
    async ({ subject, body, description, slug, email_type }) => {
      const client = new ButtondownClient(getApiKey());
      const email = await client.createDraft(subject, body, {
        description,
        slug,
        email_type,
      });
      return jsonResponse(email);
    }
  );

  // update_draft tool
  server.tool(
    "update_draft",
    "Update an existing draft email",
    {
      id: z.string().describe("The email ID to update"),
      subject: z.string().optional().describe("New subject line"),
      body: z.string().optional().describe("New body content (supports markdown)"),
      description: z.string().optional().describe("New description"),
      slug: z.string().optional().describe("New URL slug"),
      email_type: z
        .enum(["public", "private", "premium"])
        .optional()
        .describe("New audience type"),
    },
    async ({ id, subject, body, description, slug, email_type }) => {
      const client = new ButtondownClient(getApiKey());
      const email = await client.updateDraft(id, {
        subject,
        body,
        description,
        slug,
        email_type,
      });
      return jsonResponse(email);
    }
  );

  // send_draft tool
  server.tool(
    "send_draft",
    "Send a draft email immediately to subscribers",
    {
      id: z.string().describe("The draft email ID to send"),
    },
    async ({ id }) => {
      const client = new ButtondownClient(getApiKey());
      const email = await client.sendDraft(id);
      return jsonResponse(email);
    }
  );

  // schedule_draft tool
  server.tool(
    "schedule_draft",
    "Schedule a draft email to be sent at a specific time",
    {
      id: z.string().describe("The draft email ID to schedule"),
      publish_date: z
        .string()
        .describe("When to send the email (ISO 8601 format, e.g., 2024-12-25T10:00:00Z)"),
    },
    async ({ id, publish_date }) => {
      const client = new ButtondownClient(getApiKey());
      const email = await client.scheduleDraft(id, publish_date);
      return jsonResponse(email);
    }
  );

  // get_analytics tool
  server.tool(
    "get_analytics",
    "Get analytics for a sent email (open rates, click rates, etc.)",
    {
      id: z.string().describe("The email ID to get analytics for"),
    },
    async ({ id }) => {
      const client = new ButtondownClient(getApiKey());
      const analytics = await client.getAnalytics(id);
      return jsonResponse(analytics);
    }
  );

  // list_subscribers tool
  server.tool(
    "list_subscribers",
    "List subscribers from your Buttondown newsletter. Filter by subscriber type.",
    {
      page: z.number().optional().describe("Page number for pagination"),
      type: z
        .enum([
          "regular",
          "unactivated",
          "unpaid",
          "premium",
          "gifted",
          "churned",
          "past_due",
          "trialed",
          "removed",
          "spam_complaint",
          "undeliverable",
        ])
        .optional()
        .describe("Filter subscribers by type"),
    },
    async ({ page, type }) => {
      const client = new ButtondownClient(getApiKey());
      const response = await client.listSubscribers(page, type);
      return jsonResponse(response);
    }
  );

  // get_subscriber tool
  server.tool(
    "get_subscriber",
    "Get detailed information about a specific subscriber by ID or email address",
    {
      id_or_email: z
        .string()
        .describe("The subscriber ID (UUID) or email address"),
    },
    async ({ id_or_email }) => {
      const client = new ButtondownClient(getApiKey());
      const subscriber = await client.getSubscriber(id_or_email);
      return jsonResponse(subscriber);
    }
  );

  return server;
}
