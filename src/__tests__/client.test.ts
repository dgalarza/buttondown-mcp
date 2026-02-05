import { describe, it, expect } from "vitest";
import { ButtondownClient } from "../client.js";
import { mockEmail, mockAnalytics, mockSubscriber } from "./handlers.js";
import "./setup.js";

const client = new ButtondownClient("test-api-key");

describe("ButtondownClient", () => {
  describe("listEmails", () => {
    it("returns paginated list of emails", async () => {
      const response = await client.listEmails();

      expect(response.count).toBe(2);
      expect(response.results).toHaveLength(2);
      expect(response.results[0].id).toBe(mockEmail.id);
    });

    it("filters by status", async () => {
      const response = await client.listEmails("sent");

      expect(response.results).toHaveLength(1);
      expect(response.results[0].status).toBe("sent");
    });
  });

  describe("getEmail", () => {
    it("returns email by id", async () => {
      const email = await client.getEmail("em_abc123");

      expect(email.id).toBe("em_abc123");
      expect(email.subject).toBe(mockEmail.subject);
    });

    it("throws on not found", async () => {
      await expect(client.getEmail("em_notfound")).rejects.toThrow(
        "Buttondown API error (404)"
      );
    });
  });

  describe("createDraft", () => {
    it("creates a new draft email", async () => {
      const email = await client.createDraft("New Subject", "New body content");

      expect(email.id).toBe("em_new123");
      expect(email.subject).toBe("New Subject");
      expect(email.body).toBe("New body content");
      expect(email.status).toBe("draft");
    });

    it("accepts optional parameters", async () => {
      const email = await client.createDraft("Subject", "Body", {
        email_type: "premium",
        description: "Test description",
      });

      expect(email.email_type).toBe("premium");
    });
  });

  describe("updateDraft", () => {
    it("updates an existing email", async () => {
      const email = await client.updateDraft("em_test123", {
        subject: "Updated Subject",
      });

      expect(email.id).toBe("em_test123");
      expect(email.subject).toBe("Updated Subject");
    });
  });

  describe("sendDraft", () => {
    it("sends a draft email", async () => {
      const email = await client.sendDraft("em_test123");

      expect(email.id).toBe("em_test123");
      expect(email.status).toBe("about_to_send");
    });
  });

  describe("scheduleDraft", () => {
    it("schedules a draft for later", async () => {
      const publishDate = "2024-12-25T10:00:00Z";
      const email = await client.scheduleDraft("em_test123", publishDate);

      expect(email.id).toBe("em_test123");
      expect(email.status).toBe("scheduled");
      expect(email.publish_date).toBe(publishDate);
    });
  });

  describe("getAnalytics", () => {
    it("returns analytics for an email", async () => {
      const analytics = await client.getAnalytics("em_test123");

      expect(analytics.recipients).toBe(mockAnalytics.recipients);
      expect(analytics.opens).toBe(mockAnalytics.opens);
      expect(analytics.clicks).toBe(mockAnalytics.clicks);
    });

    it("throws on not found", async () => {
      await expect(client.getAnalytics("em_notfound")).rejects.toThrow(
        "Buttondown API error (404)"
      );
    });
  });

  describe("listSubscribers", () => {
    it("returns paginated list of subscribers", async () => {
      const response = await client.listSubscribers();

      expect(response.count).toBe(2);
      expect(response.results).toHaveLength(2);
      expect(response.results[0].id).toBe(mockSubscriber.id);
    });

    it("filters by type", async () => {
      const response = await client.listSubscribers(undefined, "premium");

      expect(response.results).toHaveLength(1);
      expect(response.results[0].type).toBe("premium");
    });
  });

  describe("getSubscriber", () => {
    it("returns subscriber by id", async () => {
      const subscriber = await client.getSubscriber("sub_abc123");

      expect(subscriber.id).toBe("sub_abc123");
      expect(subscriber.email_address).toBe(mockSubscriber.email_address);
    });

    it("returns subscriber by email", async () => {
      const subscriber = await client.getSubscriber("test@example.com");

      expect(subscriber.email_address).toBe("test@example.com");
    });

    it("throws on not found", async () => {
      await expect(client.getSubscriber("notfound@example.com")).rejects.toThrow(
        "Buttondown API error (404)"
      );
    });
  });
});
