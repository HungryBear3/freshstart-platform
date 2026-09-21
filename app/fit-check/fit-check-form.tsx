"use client"

import * as React from "react"
import {
  FIT_CHECK_QUESTIONS,
  type FitCheckChoice,
  type FitCheckQuestionId,
  type FitCheckResult,
} from "@/lib/fit-check/policy"
import {
  armPendingCheckoutIntent,
  buildFitCheckSignInUrl,
  clearPendingCheckoutIntent,
  normalizeCheckoutPlan,
  type CheckoutIntent,
} from "@/app/v2/_components/checkout-intent"
import { navigateTo } from "@/lib/navigation"

/**
 * The fit-check questionnaire.
 *
 * It collects bounded choices and nothing else — no free text fields exist —
 * and it never decides the outcome. It renders whatever `/api/fit-check`
 * returns.
 *
 * Two rules about the pending checkout intent live here:
 *  - a server-issued `fit` does not arm anything. It only makes the "Continue
 *    to checkout" control available; the user's click is what arms the intent.
 *  - a server-issued `review_required` or `out_of_scope` clears any intent the
 *    user arrived with, so a pricing page that resumes on load cannot bounce
 *    them straight back here forever.
 */

type AnswerDraft = Partial<Record<FitCheckQuestionId, FitCheckChoice>>

const OUTCOME_COPY: Record<FitCheckResult, { heading: string; body: string }> = {
  fit: {
    heading: "This workflow covers what you described",
    body: "Your answers match the uncontested Illinois divorce paperwork FreshStart prepares. You can continue to checkout.",
  },
  review_required: {
    heading: "A person should look at this before you continue",
    body: "Your answers include something this workflow does not handle on its own. Talking with an Illinois attorney is the right next step. If anyone is in immediate danger, call 911, or reach the Illinois Domestic Violence Helpline at 1-877-863-6338.",
  },
  out_of_scope: {
    heading: "This workflow is not built for what you described",
    body: "The current FreshStart workflow does not support a divorce like the one your answers describe, so we are not going to take your money for paperwork it cannot prepare. An Illinois attorney can tell you what your options are.",
  },
}

function isFitCheckResult(value: unknown): value is FitCheckResult {
  return value === "fit" || value === "review_required" || value === "out_of_scope"
}

/**
 * The plan and source the user arrived with, read straight off the URL so the
 * component stays renderable on the server and needs no Suspense boundary.
 */
function intentFromUrl(): CheckoutIntent {
  const search = typeof window === "undefined" ? "" : window.location.search
  const params = new URLSearchParams(search)
  return {
    plan: normalizeCheckoutPlan(params.get("plan")),
    source: params.get("source") || "fit_check",
  }
}

export function FitCheckForm() {
  const [answers, setAnswers] = React.useState<AnswerDraft>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [outcome, setOutcome] = React.useState<FitCheckResult | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [signedOut, setSignedOut] = React.useState(false)

  const complete = FIT_CHECK_QUESTIONS.every((question) => answers[question.id] !== undefined)

  async function handleSubmit() {
    if (!complete || submitting) return
    setSubmitting(true)
    setErrorMessage(null)
    setSignedOut(false)
    setOutcome(null)

    try {
      const response = await fetch("/api/fit-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = await response.json().catch(() => ({}))

      // A signed-out visitor is recoverable, not broken: the answers are still
      // on screen and signing in returns to this same page.
      if (response.status === 401) {
        setSignedOut(true)
        return
      }

      // The server's result is the only result. A refusal, or anything that is
      // not one of the three known outcomes, is treated as "no answer yet".
      if (!response.ok || !isFitCheckResult(data?.result)) {
        setErrorMessage("We could not complete the fit check. Please try again.")
        return
      }

      setOutcome(data.result)

      // A blocked outcome ends the checkout attempt the user arrived with.
      // Leaving the intent armed would let the pricing page resume it, get
      // turned away by the same server gate, and send them back here.
      if (data.result !== "fit") clearPendingCheckoutIntent()
    } catch (cause) {
      console.error("[fit-check] submission failed", cause)
      setErrorMessage("We could not complete the fit check. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * The only place a fit check arms a checkout intent: an explicit click on
   * "Continue to checkout", carrying forward the plan and source the user
   * arrived with. The `href` stays real so the control remains a link.
   */
  function handleContinue(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    const intent = intentFromUrl()
    armPendingCheckoutIntent(intent)
    navigateTo("/pricing")
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Is FreshStart a fit?</h1>

      <p data-testid="fit-check-intro" className="mt-3 text-sm text-gray-700">
        These five questions tell you whether the current FreshStart workflow can prepare your
        Illinois divorce paperwork. It is a mechanical scope check of what this product does, not
        legal advice, and it does not decide anything about your case.
      </p>

      <div className="mt-8 space-y-8">
        {FIT_CHECK_QUESTIONS.map((question) => (
          <fieldset key={question.id} className="border-t border-gray-200 pt-6">
            <legend className="text-base font-medium">{question.prompt}</legend>
            {question.help && <p className="mt-1 text-sm text-gray-600">{question.help}</p>}

            <div className="mt-3 flex flex-wrap gap-4">
              {question.choices.map((choice) => (
                <label key={choice.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={question.id}
                    value={choice.value}
                    data-testid={`fit-check-${question.id}-${choice.value}`}
                    checked={answers[question.id] === choice.value}
                    onChange={() =>
                      setAnswers((current) => ({ ...current, [question.id]: choice.value }))
                    }
                  />
                  {choice.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!complete || submitting}
        className="mt-8 rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
      >
        Check fit
      </button>

      {errorMessage && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {signedOut && (
        <div
          data-testid="fit-check-signed-out"
          role="alert"
          className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-gray-800"
        >
          <p>
            You need to be signed in to save this fit check. Sign in and we will bring you back here
            with your checkout plan preserved; submit the fit check again after signing in.
          </p>
          <a
            data-testid="fit-check-signin"
            href={buildFitCheckSignInUrl(intentFromUrl())}
            className="mt-3 inline-block font-medium text-blue-700 underline"
          >
            Sign in and return to the fit check
          </a>
        </div>
      )}

      {outcome && (
        <div
          data-testid="fit-check-outcome"
          data-result={outcome}
          className="mt-8 rounded-md border border-gray-200 p-5"
        >
          <h2 className="text-lg font-medium">{OUTCOME_COPY[outcome].heading}</h2>
          <p className="mt-2 text-sm text-gray-700">{OUTCOME_COPY[outcome].body}</p>

          {outcome === "fit" && (
            <a
              data-testid="fit-check-continue"
              href="/pricing"
              onClick={handleContinue}
              className="mt-5 inline-block rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white"
            >
              Continue to checkout
            </a>
          )}
        </div>
      )}
    </div>
  )
}
