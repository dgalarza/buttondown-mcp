import { http, HttpResponse } from "msw";

const API_BASE = "https://api.buttondown.com/v1";

export const mockEmail = {
  id: "em_test123",
  creation_date: "2024-01-01T00:00:00Z",
  modification_date: "2024-01-01T00:00:00Z",
  subject: "Test Email",
  body: "Hello, world!",
  status: "draft",
  publish_date: null,
  email_type: "public",
  slug: "test-email",
  description: "A test email",
  absolute_url: "https://buttondown.com/test/archive/test-email",
  analytics: null,
  metadata: {},
};

export const mockAnalytics = {
  recipients: 100,
  deliveries: 98,
  opens: 50,
  clicks: 25,
  temporary_failures: 1,
  permanent_failures: 1,
  unsubscriptions: 2,
  complaints: 0,
  survey_responses: 0,
  webmentions: 0,
  page_views_lifetime: 150,
  page_views_30: 50,
  page_views_7: 10,
  subscriptions: 5,
  paid_subscriptions: 1,
  replies: 3,
  comments: 2,
  social_mentions: 1,
};

export const mockSubscriber = {
  id: "13121cd6-0dfc-424c-bb12-988b0a32fcb3",
  creation_date: "2020-09-29T00:00:00+00:00",
  avatar_url: "",
  churn_date: null,
  email_address: "telemachus@buttondown.email",
  gift_subscription_message: "",
  ip_address: null,
  last_click_date: null,
  last_open_date: null,
  metadata: { name: "Telemachus" },
  notes: "",
  purchased_by: null,
  purchased_message: null,
  referral_code: "",
  referrer_url: "",
  risk_score: null,
  secondary_id: 1,
  source: "organic",
  stripe_coupon: null,
  stripe_customer_id: null,
  subscriber_import_id: null,
  tags: [],
  transitions: [],
  email_transitions: [],
  firewall_reasons: [],
  type: "regular",
  undeliverability_date: null,
  undeliverability_reason: null,
  unsubscription_date: null,
  unsubscription_reason: "",
  upgrade_date: null,
  utm_campaign: "",
  utm_medium: "",
  utm_source: "",
  stripe_customer: null,
};

export const handlers = [
  // List emails
  http.get(`${API_BASE}/emails`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const emails = status
      ? [{ ...mockEmail, status }]
      : [mockEmail, { ...mockEmail, id: "em_test456", status: "sent" }];

    return HttpResponse.json({
      count: emails.length,
      next: null,
      previous: null,
      results: emails,
    });
  }),

  // Get single email
  http.get(`${API_BASE}/emails/:id`, ({ params }) => {
    const { id } = params;

    if (id === "em_notfound") {
      return HttpResponse.json({ detail: "Not found." }, { status: 404 });
    }

    return HttpResponse.json({ ...mockEmail, id });
  }),

  // Create email
  http.post(`${API_BASE}/emails`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      ...mockEmail,
      id: "em_new123",
      subject: body.subject,
      body: body.body,
      status: body.status || "draft",
      email_type: body.email_type || "public",
    });
  }),

  // Update email
  http.patch(`${API_BASE}/emails/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      ...mockEmail,
      id,
      ...body,
    });
  }),

  // Send draft
  http.post(`${API_BASE}/emails/:id/send-draft`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      ...mockEmail,
      id,
      status: "about_to_send",
    });
  }),

  // Get analytics
  http.get(`${API_BASE}/emails/:id/analytics`, ({ params }) => {
    const { id } = params;

    if (id === "em_notfound") {
      return HttpResponse.json({ detail: "Not found." }, { status: 404 });
    }

    return HttpResponse.json(mockAnalytics);
  }),

  // List subscribers
  http.get(`${API_BASE}/subscribers`, ({ request }) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    const subscribers = type
      ? [{ ...mockSubscriber, type }]
      : [mockSubscriber, { ...mockSubscriber, id: "sub_456", type: "premium" }];

    return HttpResponse.json({
      count: subscribers.length,
      next: null,
      previous: null,
      results: subscribers,
    });
  }),

  // Get single subscriber
  http.get(`${API_BASE}/subscribers/:idOrEmail`, ({ params }) => {
    const { idOrEmail } = params;

    if (idOrEmail === "notfound@example.com" || idOrEmail === "sub_notfound") {
      return HttpResponse.json({ detail: "Not found." }, { status: 404 });
    }

    // If it looks like an email, use it as the email address
    const isEmail = typeof idOrEmail === "string" && idOrEmail.includes("@");
    return HttpResponse.json({
      ...mockSubscriber,
      id: isEmail ? mockSubscriber.id : idOrEmail,
      email_address: isEmail ? idOrEmail : mockSubscriber.email_address,
    });
  }),
];
