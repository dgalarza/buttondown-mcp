const API_BASE_URL = "https://api.buttondown.com/v1";

export interface ButtondownEmail {
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

export interface EmailAnalytics {
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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class ButtondownClient {
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
