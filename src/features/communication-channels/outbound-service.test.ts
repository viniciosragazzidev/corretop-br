import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildBrokerInvitationFallbackMessage } from "./outbound-service";

describe("buildBrokerInvitationFallbackMessage", () => {
  it("formata o link direto sem registrar dados além do necessário", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://crm.example.com/";
    const message = buildBrokerInvitationFallbackMessage({
      name: "Ana",
      company: "Ancora",
      role: "broker",
      token: "token-seguro",
    });
    expect(message).toContain("Olá, Ana!");
    expect(message).toContain("https://crm.example.com/onboarding?token=token-seguro");
    expect(message).toContain("Corretor");
  });
});
