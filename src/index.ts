#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = "https://api.buttondown.com/v1";

interface ButtondownEmail {
  id: string;
  creation_date: string;
  modification_date: string;
  subject: string;
  body: string;
  status: string;
  publish_date: string | null;
  email_type: string;
  slug: string;
  description: string;
  absolute_url: string;
  analytics: EmailAnalytics | null;
  metadata: Record<string, unknown>;
}

interface EmailAnalytics {
  recipients: number;
  deliveries: number;
  opens: number;
  clicks: number;
  temporary_failures: number;
  permanent_failures: number;
  unsubscriptions: number;
  complaints: number;
  survey_responses: number;
  webmentions: number;
  page_views_lifetime: number;
  page_views_30: number;
  page_views_7: number;
  subscriptions: number;
  paid_subscriptions: number;
  replies: number;
  comments: number;
  social_mentions: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class ButtondownClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Buttondown API error (${response.status}): ${errorText}`
      );
    }

    return response.json() as Promise<T>;
  }

  async listEmails(
    status?: string,
    page?: number
  ): Promise<PaginatedResponse<ButtondownEmail>> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (page) params.append("page", page.toString());

    const query = params.toString();
    return this.request<PaginatedResponse<ButtondownEmail>>(
      `/emails${query ? `?${query}` : ""}`
    );
  }

  async getEmail(id: string): Promise<ButtondownEmail> {
    return this.request<ButtondownEmail>(`/emails/${id}`);
  }

  async createDraft(
    subject: string,
    body: string,
    options?: {
      email_type?: string;
      description?: string;
      slug?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ButtondownEmail> {
    return this.request<ButtondownEmail>("/emails", {
      method: "POST",
      body: JSON.stringify({
        subject,
        body,
        status: "draft",
        ...options,
      }),
    });
  }

  async updateDraft(
    id: string,
    updates: {
      subject?: string;
      body?: string;
      description?: string;
      slug?: string;
      email_type?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<ButtondownEmail> {
    return this.request<ButtondownEmail>(`/emails/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  async sendDraft(id: string): Promise<ButtondownEmail> {
    return this.request<ButtondownEmail>(`/emails/${id}/send-draft`, {
      method: "POST",
    });
  }

  async scheduleDraft(
    id: string,
    publishDate: string
  ): Promise<ButtondownEmail> {
    return this.request<ButtondownEmail>(`/emails/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "scheduled",
        publish_date: publishDate,
      }),
    });
  }

  async getAnalytics(id: string): Promise<EmailAnalytics> {
    return this.request<EmailAnalytics>(`/emails/${id}/analytics`);
  }
}

function getApiKey(): string {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BUTTONDOWN_API_KEY environment variable is required. " +
        "Get your API key from https://buttondown.com/settings/api"
    );
  }
  return apiKey;
}

function formatEmail(email: ButtondownEmail): string {
  return [
    `ID: ${email.id}`,
    `Subject: ${email.subject}`,
    `Status: ${email.status}`,
    `Created: ${email.creation_date}`,
    `Modified: ${email.modification_date}`,
    email.publish_date ? `Publish Date: ${email.publish_date}` : null,
    `Type: ${email.email_type}`,
    `URL: ${email.absolute_url}`,
    email.description ? `Description: ${email.description}` : null,
    "",
    "--- Body ---",
    email.body,
  ]
    .filter(Boolean)
    .join("\n");
}

function formatAnalytics(analytics: EmailAnalytics): string {
  const openRate =
    analytics.deliveries > 0
      ? ((analytics.opens / analytics.deliveries) * 100).toFixed(1)
      : "0";
  const clickRate =
    analytics.deliveries > 0
      ? ((analytics.clicks / analytics.deliveries) * 100).toFixed(1)
      : "0";

  return [
    "Email Analytics",
    "==============",
    "",
    `Recipients: ${analytics.recipients}`,
    `Deliveries: ${analytics.deliveries}`,
    "",
    `Opens: ${analytics.opens} (${openRate}%)`,
    `Clicks: ${analytics.clicks} (${clickRate}%)`,
    "",
    `Unsubscriptions: ${analytics.unsubscriptions}`,
    `Complaints: ${analytics.complaints}`,
    "",
    `Temporary Failures: ${analytics.temporary_failures}`,
    `Permanent Failures: ${analytics.permanent_failures}`,
    "",
    "Engagement:",
    `  Replies: ${analytics.replies}`,
    `  Comments: ${analytics.comments}`,
    `  Survey Responses: ${analytics.survey_responses}`,
    `  Social Mentions: ${analytics.social_mentions}`,
    "",
    "Page Views:",
    `  Lifetime: ${analytics.page_views_lifetime}`,
    `  Last 30 days: ${analytics.page_views_30}`,
    `  Last 7 days: ${analytics.page_views_7}`,
    "",
    "Conversions:",
    `  New Subscriptions: ${analytics.subscriptions}`,
    `  Paid Subscriptions: ${analytics.paid_subscriptions}`,
  ].join("\n");
}

async function main() {
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

      const emailList = response.results
        .map(
          (email) =>
            `- [${email.status}] ${email.subject} (ID: ${email.id}, Created: ${email.creation_date})`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Found ${response.count} email(s)${status ? ` with status "${status}"` : ""}`,
              "",
              emailList || "No emails found.",
              "",
              response.next ? `More results available (page ${(page || 1) + 1})` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      };
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

      return {
        content: [
          {
            type: "text" as const,
            text: formatEmail(email),
          },
        ],
      };
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

      return {
        content: [
          {
            type: "text" as const,
            text: [
              "Draft created successfully!",
              "",
              formatEmail(email),
            ].join("\n"),
          },
        ],
      };
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

      return {
        content: [
          {
            type: "text" as const,
            text: [
              "Draft updated successfully!",
              "",
              formatEmail(email),
            ].join("\n"),
          },
        ],
      };
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

      return {
        content: [
          {
            type: "text" as const,
            text: [
              "Email sent successfully!",
              "",
              `Subject: ${email.subject}`,
              `Status: ${email.status}`,
              `ID: ${email.id}`,
            ].join("\n"),
          },
        ],
      };
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

      return {
        content: [
          {
            type: "text" as const,
            text: [
              "Email scheduled successfully!",
              "",
              `Subject: ${email.subject}`,
              `Status: ${email.status}`,
              `Scheduled for: ${email.publish_date}`,
              `ID: ${email.id}`,
            ].join("\n"),
          },
        ],
      };
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

      return {
        content: [
          {
            type: "text" as const,
            text: formatAnalytics(analytics),
          },
        ],
      };
    }
  );

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
