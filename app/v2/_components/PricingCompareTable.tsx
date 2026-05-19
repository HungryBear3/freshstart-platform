import * as React from "react";
import { compareRows, type TierKey } from "./tiers";

function CellVal({ v }: { v: string | boolean }) {
  if (v === true)
    return (
      <span className="fs-pr-check fs-pr-check-table" aria-label="included">
        ✓
      </span>
    );
  if (v === false)
    return (
      <span className="fs-pr-table-dash" aria-label="not included">
        —
      </span>
    );
  return <span className="fs-pr-table-text">{v}</span>;
}

export function PricingCompareTable({
  threeTier,
  recommended,
}: {
  threeTier: boolean;
  recommended: TierKey;
}) {
  const visibleRows = compareRows.filter((row) => {
    const visibleValues = threeTier ? row.slice(1) : row.slice(1, 3);
    return visibleValues.some((value) => value !== false);
  });

  return (
    <section className="fs-pr-compare" aria-labelledby="compare-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head fs-section-head-c">
          <div className="fs-section-eyebrow">Side by side</div>
          <h2 id="compare-h2" className="fs-h2">
            Every difference, in one table.
          </h2>
        </div>
        <div className="fs-pr-compare-wrap">
          <table className="fs-pr-table">
            <caption className="fs-sr">FreshStart IL tier comparison</caption>
            <thead>
              <tr>
                <th scope="col" className="fs-pr-table-feat">
                  Feature
                </th>
                <th scope="col">
                  Essential<span className="fs-pr-table-price">$149</span>
                </th>
                <th scope="col" className={recommended === "plus" ? "is-rec" : undefined}>
                  Plus<span className="fs-pr-table-price">$299/yr</span>
                </th>
                {threeTier && (
                  <th
                    scope="col"
                    className={recommended === "concierge" ? "is-rec" : undefined}
                  >
                    Concierge<span className="fs-pr-table-price">$499</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
                <tr key={`${row[0]}-${i}`}>
                  <th scope="row" className="fs-pr-table-feat">
                    {row[0]}
                  </th>
                  <td>
                    <CellVal v={row[1]} />
                  </td>
                  <td className={recommended === "plus" ? "is-rec" : undefined}>
                    <CellVal v={row[2]} />
                  </td>
                  {threeTier && (
                    <td className={recommended === "concierge" ? "is-rec" : undefined}>
                      <CellVal v={row[3]} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
