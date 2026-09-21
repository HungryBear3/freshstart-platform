import type { Metadata } from "next"
import { FitCheckForm } from "./fit-check-form"

export const metadata: Metadata = {
  title: "Is FreshStart a fit? | FreshStart Illinois",
  description:
    "A short scope check that tells you whether the current FreshStart workflow can prepare your Illinois divorce paperwork.",
  robots: { index: false, follow: false },
}

export default function FitCheckPage() {
  return <FitCheckForm />
}
