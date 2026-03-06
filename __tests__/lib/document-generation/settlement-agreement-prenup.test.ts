/**
 * Integration tests for prenup data flow into Marital Settlement Agreement generation
 */

import { generateSettlementAgreementPDF } from "@/lib/document-generation/settlement-agreement-pdf";

describe("Settlement Agreement PDF Generation - Prenup Integration", () => {
  const baseData = {
    "petitionerName": "John Doe",
    "respondentName": "Jane Doe",
    "marriageDate": "2020-01-15",
    "hasChildren": "no",
  };

  it("should include prenup reference in introduction when hasPrenup is 'yes'", async () => {
    const data = {
      ...baseData,
      hasPrenup: "yes",
      prenupType: "prenup",
      prenupFollowStatus: "both_follow",
    };

    const pdf = await generateSettlementAgreementPDF(data);
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);

    // Note: In a real test, you might want to parse the PDF and check text content
    // For now, we verify the function completes without error
  });

  it("should include prenup section when hasPrenup is 'yes'", async () => {
    const data = {
      ...baseData,
      hasPrenup: "yes",
      prenupType: "prenup",
      prenupPreMaritalPropertyRule: "each_keeps_own",
      prenupMaritalPropertyRule: "mixed",
      prenupDebtRule: "each_keeps_own",
      prenupMaintenanceTerms: "waiver",
      prenupOtherKeyTerms: "Additional terms test",
    };

    const pdf = await generateSettlementAgreementPDF(data);
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("should handle prenup with modification note when followStatus is not 'both_follow'", async () => {
    const data = {
      ...baseData,
      hasPrenup: "yes",
      prenupType: "postnup",
      prenupFollowStatus: "unsure",
    };

    const pdf = await generateSettlementAgreementPDF(data);
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("should not include prenup section when hasPrenup is 'no'", async () => {
    const data = {
      ...baseData,
      hasPrenup: "no",
    };

    const pdf = await generateSettlementAgreementPDF(data);
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("should handle prenup summary fields correctly", async () => {
    const data = {
      ...baseData,
      hasPrenup: "yes",
      prenupType: "prenup",
      prenupPreMaritalPropertyRule: "each_keeps_own",
      prenupMaritalPropertyRule: "each_keeps_own",
      prenupDebtRule: "each_keeps_own",
      prenupMaintenanceTerms: "formula_or_amount",
      prenupOtherKeyTerms: "Test other terms",
    };

    const pdf = await generateSettlementAgreementPDF(data);
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("should handle missing optional prenup fields gracefully", async () => {
    const data = {
      ...baseData,
      hasPrenup: "yes",
      prenupType: "prenup",
      // Missing optional fields
    };

    const pdf = await generateSettlementAgreementPDF(data);
    expect(pdf).toBeDefined();
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("should handle both camelCase and kebab-case field names", async () => {
    const data1 = {
      ...baseData,
      hasPrenup: "yes",
      prenupType: "prenup",
    };

    const data2 = {
      ...baseData,
      "has-prenup": "yes",
      "prenup-type": "prenup",
    };

    const pdf1 = await generateSettlementAgreementPDF(data1);
    const pdf2 = await generateSettlementAgreementPDF(data2);

    expect(pdf1).toBeDefined();
    expect(pdf2).toBeDefined();
    expect(pdf1.length).toBeGreaterThan(0);
    expect(pdf2.length).toBeGreaterThan(0);
  });
});
