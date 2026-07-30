"use client";

const items = [
  {
    name: "Parenting plan worksheet",
    price: "$29",
    body: "Optional standalone worksheet for parenting-time terms and schedules.",
    ic: "👨‍👩‍👧",
  },
  {
    name: "Refile assistance",
    price: "$49",
    body: "Optional help reviewing a clerk's filing or format note before you revise and resubmit.",
    ic: "↻",
  },
];

export function PricingAddons() {
  return (
    <section className="fs-pr-addons" aria-labelledby="addons-h2">
      <div className="fs-section-inner">
        <div className="fs-section-head fs-section-head-c">
          <div className="fs-section-eyebrow">À la carte</div>
          <h2 id="addons-h2" className="fs-h2">Add only what your case needs.</h2>
          <p>These options are shown for planning only. Payment is unavailable until durable fulfillment is supported.</p>
        </div>
        <div className="fs-pr-addon-grid">
          {items.map((it) => (
            <article className="fs-pr-addon" key={it.name}>
              <div className="fs-pr-addon-ic" aria-hidden="true">{it.ic}</div>
              <div className="fs-pr-addon-name">{it.name}</div>
              <div className="fs-pr-addon-body">{it.body}</div>
              <div className="fs-pr-addon-foot">
                <span className="fs-pr-addon-price">{it.price}</span>
                <button type="button" className="fs-pr-addon-add" disabled aria-label={`${it.name} payment unavailable`}>
                  Unavailable
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
