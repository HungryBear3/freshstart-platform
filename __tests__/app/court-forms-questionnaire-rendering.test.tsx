/**
 * @jest-environment jsdom
 */
import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

import CourtFormsLibraryPage from "@/app/legal-info/court-forms/court-forms-client"
import type { RenderedFormDTO } from "@/lib/forms/court-forms-read-model"

const petition: RenderedFormDTO = {
  id: "petition-no-children",
  name: "Petition for Divorce",
  description: "Statewide petition without minor children.",
  category: "petition",
  officialUrl: "https://www.illinoiscourts.gov/",
  version: "03/25",
  lastUpdated: "2026-09-14",
  requiredFor: ["no_children"],
  relatedQuestionnaires: ["petition"],
  filename: "petition-dissolution-no-children.pdf",
  downloadHref: null,
}

describe("court-form questionnaire presentation", () => {
  it("renders an evidence-supported questionnaire after details are expanded", async () => {
    const user = userEvent.setup()
    render(<CourtFormsLibraryPage forms={[petition]} gatedNotices={[]} />)

    expect(screen.queryByText("Related Questionnaires")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Details" }))

    expect(screen.getByText("Related Questionnaires")).toBeInTheDocument()
    expect(
      screen.getByText(/Questionnaires that collect information relevant to this form:\s*petition/),
    ).toBeInTheDocument()
  })
})
