import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CourtFormsLibraryPage from "@/app/legal-info/court-forms/page";

describe("court forms source and conditional labels", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ progress: {} }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("visibly distinguishes the conditional federal IWO from Illinois standardized forms", async () => {
    render(<CourtFormsLibraryPage />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/api/questionnaires/progress"));

    expect(screen.queryByText(/All forms are sourced from the Illinois Courts website/i)).toBeNull();
    expect(screen.queryByText(/These forms are required to be accepted by all Illinois Circuit Courts/i)).toBeNull();

    fireEvent.click(screen.getByText("Support Forms"));

    expect(screen.getByText("Income Withholding for Support")).toBeTruthy();
    expect(screen.getByText("Conditional use")).toBeTruthy();
    expect(screen.getByText("Federal HHS/OCSS source")).toBeTruthy();
    expect(screen.getByText(/Use only when the case-specific support conditions apply/i)).toBeTruthy();
  });
});
