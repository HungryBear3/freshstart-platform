/**
 * Unit tests for prenup branching logic
 */

import {
  getPrenupStatus,
  getPrenupGuidance,
  checkPrenupSafetyConcerns,
  PrenupContext,
} from "@/lib/prenup/branching";

describe("getPrenupStatus", () => {
  it("should return 'none' when hasPrenup is 'no'", () => {
    const context: PrenupContext = {
      hasPrenup: "no",
    };
    expect(getPrenupStatus(context)).toBe("none");
  });

  it("should return 'none' when hasPrenup is 'not_sure'", () => {
    const context: PrenupContext = {
      hasPrenup: "not_sure",
    };
    expect(getPrenupStatus(context)).toBe("none");
  });

  it("should return 'uncontested' when both spouses want to follow", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupFollowStatus: "both_follow",
    };
    expect(getPrenupStatus(context)).toBe("uncontested");
  });

  it("should return 'disputed' when one or both unsure", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupFollowStatus: "unsure",
    };
    expect(getPrenupStatus(context)).toBe("disputed");
  });

  it("should return 'disputed' when one or both do not want to follow", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupFollowStatus: "one_or_both_not_follow",
    };
    expect(getPrenupStatus(context)).toBe("disputed");
  });

  it("should return 'unclear' when hasPrenup is yes but followStatus is missing", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
    };
    expect(getPrenupStatus(context)).toBe("unclear");
  });
});

describe("getPrenupGuidance", () => {
  it("should return appropriate message for 'none' status", () => {
    const guidance = getPrenupGuidance("none");
    expect(guidance.message).toContain("Most Illinois divorces");
    expect(guidance.showCaution).toBe(false);
    expect(guidance.suggestLegalAdvice).toBe(false);
  });

  it("should return appropriate message for 'uncontested' status", () => {
    const guidance = getPrenupGuidance("uncontested");
    expect(guidance.message).toContain("prenup that you both seem comfortable");
    expect(guidance.showCaution).toBe(true);
    expect(guidance.suggestLegalAdvice).toBe(false);
  });

  it("should return appropriate message for 'disputed' status", () => {
    const guidance = getPrenupGuidance("disputed");
    expect(guidance.message).toContain("complex area");
    expect(guidance.showCaution).toBe(true);
    expect(guidance.suggestLegalAdvice).toBe(true);
  });

  it("should return appropriate message for 'unclear' status", () => {
    const guidance = getPrenupGuidance("unclear");
    expect(guidance.message).toContain("complex area");
    expect(guidance.showCaution).toBe(true);
    expect(guidance.suggestLegalAdvice).toBe(true);
  });
});

describe("checkPrenupSafetyConcerns", () => {
  it("should not detect concerns when all safety indicators are positive", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupIndependentCounsel: "both",
      prenupFullDisclosure: "full",
      prenupFollowStatus: "both_follow",
      prenupPressureIndicator: "no",
      hasIndependentFinancialAccess: "yes",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasConcerns).toBe(false);
    expect(result.hasSafetyConcerns).toBe(false);
    expect(result.concerns.length).toBe(0);
    expect(result.safetyConcerns.length).toBe(0);
  });

  it("should detect general concerns for lack of independent counsel", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupIndependentCounsel: "none",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasConcerns).toBe(true);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("independent legal counsel");
  });

  it("should detect general concerns for lack of disclosure", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupFullDisclosure: "none",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasConcerns).toBe(true);
    expect(result.concerns.some(c => c.includes("financial disclosure"))).toBe(true);
  });

  it("should detect safety concerns when pressure indicator is 'yes'", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupPressureIndicator: "yes",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasSafetyConcerns).toBe(true);
    expect(result.safetyConcerns.length).toBeGreaterThan(0);
    expect(result.safetyConcerns[0]).toContain("pressured or unsafe");
  });

  it("should detect safety concerns when financial access is limited", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      hasIndependentFinancialAccess: "no",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasSafetyConcerns).toBe(true);
    expect(result.safetyConcerns.some(c => c.includes("financial accounts"))).toBe(true);
  });

  it("should detect safety concerns when financial access is partial", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      hasIndependentFinancialAccess: "partial",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasSafetyConcerns).toBe(true);
  });

  it("should not detect safety concerns when pressure indicator is 'prefer_not_to_say'", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupPressureIndicator: "prefer_not_to_say",
      hasIndependentFinancialAccess: "yes",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasSafetyConcerns).toBe(false);
  });

  it("should detect multiple safety concerns", () => {
    const context: PrenupContext = {
      hasPrenup: "yes",
      prenupPressureIndicator: "yes",
      hasIndependentFinancialAccess: "no",
    };
    const result = checkPrenupSafetyConcerns(context);
    expect(result.hasSafetyConcerns).toBe(true);
    expect(result.safetyConcerns.length).toBe(2);
  });
});
