# No public court-form artifacts

Do not place Illinois, federal, county, or FreshStart form PDFs in this directory.

`lib/forms/illinois-court-forms.ts` is an evidence-bound identity catalog, not
download authority. A statewide artifact must remain unavailable until its exact
URL, printed code/revision, SHA-256, byte length, field mapping, and generated
output have independently passed review. Unmapped and unsupported identities
fail closed.

The federal Income Withholding for Support artifact remains under
`private/official-forms/` and is served only through its existing guarded route
after its separate artifact, policy, county, and per-case checks pass.

FreshStart templates and county/non-statewide forms must be stored and labeled
under their own authority; they must never be added here or described as
Illinois Supreme Court standardized artifacts.
