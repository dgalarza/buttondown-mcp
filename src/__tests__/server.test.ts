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
});
