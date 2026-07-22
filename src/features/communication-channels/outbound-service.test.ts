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
    expect(message).toContain("✨ *Olá, Ana!*");
    expect(message).toContain("https://crm.example.com/onboarding?token=token-seguro");
    expect(message).toContain("*Corretor(a)*");
    expect(message).toContain("🚀");
    expect(message).toContain("*Ancora*");
    expect(message).toContain("👇");
  });

  it("usa o cargo original para funções não mapeadas", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.corretop.com/";
    const message = buildBrokerInvitationFallbackMessage({
      name: "Carlos",
      company: "Corretora XYZ",
      role: "admin",
      token: "abc123",
    });
    expect(message).toContain("*admin*");
  });

  it("usa 'Gestor(a)' para o papel manager", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.corretop.com/";
    const message = buildBrokerInvitationFallbackMessage({
      name: "Maria",
      company: "Corretora ABC",
      role: "manager",
      token: "token-maria",
    });
    expect(message).toContain("*Gestor(a)*");
  });

  it("funciona sem nome (fallback)", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.corretop.com/";
    const message = buildBrokerInvitationFallbackMessage({
      token: "token-only",
    });
    expect(message).toContain("✨ *Olá!*");
    expect(message).toContain("sua corretora");
    expect(message).toContain("*Colaborador(a)*");
    expect(message).toContain("👇");
  });
});
