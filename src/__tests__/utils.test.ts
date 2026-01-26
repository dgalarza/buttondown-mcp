import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getApiKey, jsonResponse } from "../utils.js";

describe("utils", () => {
  describe("getApiKey", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("returns API key when set", () => {
      process.env.BUTTONDOWN_API_KEY = "test-key-123";
      expect(getApiKey()).toBe("test-key-123");
    });

    it("throws when API key is not set", () => {
      delete process.env.BUTTONDOWN_API_KEY;
      expect(() => getApiKey()).toThrow(
        "BUTTONDOWN_API_KEY environment variable is required"
      );
    });
  });

  describe("jsonResponse", () => {
    it("formats data as JSON text content", () => {
      const data = { foo: "bar", count: 42 };
      const response = jsonResponse(data);

      expect(response.content).toHaveLength(1);
      expect(response.content[0].type).toBe("text");
      expect(response.content[0].text).toBe(JSON.stringify(data, null, 2));
    });

    it("handles arrays", () => {
      const data = [1, 2, 3];
      const response = jsonResponse(data);

      expect(JSON.parse(response.content[0].text)).toEqual([1, 2, 3]);
    });

    it("handles null", () => {
      const response = jsonResponse(null);

      expect(response.content[0].text).toBe("null");
    });
  });
});
