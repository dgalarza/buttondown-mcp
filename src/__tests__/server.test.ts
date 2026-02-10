import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../server.js";
import "./setup.js";

interface TextContent {
  type: "text";
  text: string;
}

interface ToolResult {
  content: TextContent[];
}

describe("MCP Server", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(() => {
    process.env.BUTTONDOWN_API_KEY = "test-api-key";
  });

  beforeEach(async () => {
    const server = createServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });

    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  describe("list_emails tool", () => {
    it("lists all emails", async () => {
      const result = (await client.callTool({
        name: "list_emails",
        arguments: {},
      })) as ToolResult;

      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(2);
      expect(data.results).toHaveLength(2);
    });

    it("filters by status", async () => {
      const result = (await client.callTool({
        name: "list_emails",
        arguments: { status: "draft" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.results[0].status).toBe("draft");
    });
  });

  describe("get_email tool", () => {
    it("retrieves an email by id", async () => {
      const result = (await client.callTool({
        name: "get_email",
        arguments: { id: "em_test123" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe("em_test123");
      expect(data.subject).toBe("Test Email");
    });
  });

  describe("create_draft tool", () => {
    it("creates a new draft", async () => {
      const result = (await client.callTool({
        name: "create_draft",
        arguments: {
          subject: "My New Email",
          body: "Hello subscribers!",
        },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.subject).toBe("My New Email");
      expect(data.body).toBe("Hello subscribers!");
      expect(data.status).toBe("draft");
    });
  });

  describe("update_draft tool", () => {
    it("updates an existing draft", async () => {
      const result = (await client.callTool({
        name: "update_draft",
        arguments: {
          id: "em_test123",
          subject: "Updated Subject",
        },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe("em_test123");
      expect(data.subject).toBe("Updated Subject");
    });
  });

  describe("send_draft tool", () => {
    it("sends a draft immediately", async () => {
      const result = (await client.callTool({
        name: "send_draft",
        arguments: { id: "em_test123" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe("about_to_send");
    });
  });

  describe("schedule_draft tool", () => {
    it("schedules a draft for later", async () => {
      const result = (await client.callTool({
        name: "schedule_draft",
        arguments: {
          id: "em_test123",
          publish_date: "2024-12-25T10:00:00Z",
        },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.status).toBe("scheduled");
      expect(data.publish_date).toBe("2024-12-25T10:00:00Z");
    });
  });

  describe("get_analytics tool", () => {
    it("retrieves analytics for an email", async () => {
      const result = (await client.callTool({
        name: "get_analytics",
        arguments: { id: "em_test123" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.recipients).toBe(100);
      expect(data.opens).toBe(50);
      expect(data.clicks).toBe(25);
    });
  });

describe("list_subscribers tool", () => {
    it("lists all subscribers", async () => {
      const result = (await client.callTool({
        name: "list_subscribers",
        arguments: {},
      })) as ToolResult;

      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(2);
      expect(data.results).toHaveLength(2);
    });

    it("filters by type", async () => {
      const result = (await client.callTool({
        name: "list_subscribers",
        arguments: { type: "premium" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.results[0].type).toBe("premium");
    });
  });

  describe("get_subscriber tool", () => {
    it("retrieves a subscriber by id", async () => {
      const result = (await client.callTool({
        name: "get_subscriber",
        arguments: { id_or_email: "sub_test123" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe("sub_test123");
    });

    it("retrieves a subscriber by email", async () => {
      const result = (await client.callTool({
        name: "get_subscriber",
        arguments: { id_or_email: "test@example.com" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.email_address).toBe("test@example.com");
    });
  });

  describe("get_subscriber_stats tool", () => {
    it("returns aggregate subscriber stats", async () => {
      const result = (await client.callTool({
        name: "get_subscriber_stats",
        arguments: {},
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.total).toBe(227);
      expect(data.by_type.regular).toBe(150);
      expect(data.by_type.premium).toBe(25);
      expect(data.by_type.churned).toBe(8);
    });
  });

  describe("list_subscribers tool (trimmed)", () => {
    it("returns only essential subscriber fields", async () => {
      const result = (await client.callTool({
        name: "list_subscribers",
        arguments: {},
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      const subscriber = data.results[0];

      // Essential fields are present
      expect(subscriber.id).toBeDefined();
      expect(subscriber.email_address).toBeDefined();
      expect(subscriber.type).toBeDefined();
      expect(subscriber.creation_date).toBeDefined();
      expect(subscriber.tags).toBeDefined();
      expect(subscriber.source).toBeDefined();

      // Heavy fields are stripped
      expect(subscriber.transitions).toBeUndefined();
      expect(subscriber.email_transitions).toBeUndefined();
      expect(subscriber.stripe_customer).toBeUndefined();
      expect(subscriber.stripe_customer_id).toBeUndefined();
      expect(subscriber.metadata).toBeUndefined();
      expect(subscriber.ip_address).toBeUndefined();
    });
  });

  describe("list_tags tool", () => {
    it("lists all tags", async () => {
      const result = (await client.callTool({
        name: "list_tags",
        arguments: {},
      })) as ToolResult;

      expect(result.content).toHaveLength(1);
      const data = JSON.parse(result.content[0].text);
      expect(data.count).toBe(2);
      expect(data.results).toHaveLength(2);
    });
  });

  describe("get_tag tool", () => {
    it("retrieves a tag by id", async () => {
      const result = (await client.callTool({
        name: "get_tag",
        arguments: { id: "tag_abc123" },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe("tag_abc123");
      expect(data.name).toBe("Newsletter");
    });
  });

  describe("create_tag tool", () => {
    it("creates a new tag", async () => {
      const result = (await client.callTool({
        name: "create_tag",
        arguments: {
          name: "New Tag",
          color: "#FF0000",
          description: "A new tag",
        },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.name).toBe("New Tag");
      expect(data.color).toBe("#FF0000");
      expect(data.description).toBe("A new tag");
    });
  });

  describe("update_tag tool", () => {
    it("updates an existing tag", async () => {
      const result = (await client.callTool({
        name: "update_tag",
        arguments: {
          id: "tag_abc123",
          name: "Updated Tag",
        },
      })) as ToolResult;

      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe("tag_abc123");
      expect(data.name).toBe("Updated Tag");
    });
  });

  describe("delete_tag tool", () => {
    it("deletes a tag", async () => {
      const result = (await client.callTool({
        name: "delete_tag",
        arguments: { id: "tag_abc123" },
      })) as ToolResult;

      expect(result.content[0].text).toBe("Tag tag_abc123 deleted successfully");
    });
  });
});
