const ArrowRight = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" strokeLinejoin="round" />
    <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function MetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "amber" | "blue";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    green: "border-emerald-100 bg-emerald-50/60 text-emerald-700",
    amber: "border-amber-100 bg-amber-50/70 text-amber-700",
    blue: "border-indigo-100 bg-indigo-50/70 text-indigo-700",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-indigo-100 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${styles[variant]}`}>
      {children}
    </span>
  );
}

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-[#f8fafc]/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
              <BoxIcon />
            </span>
            <span className="text-xl font-bold tracking-tight">StockSense</span>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a className="transition hover:text-slate-950" href="#product">Product</a>
            <a className="transition hover:text-slate-950" href="#workflow">Workflow</a>
            <a className="transition hover:text-slate-950" href="#features">Features</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="/login" className="hidden text-sm font-semibold text-slate-700 sm:block">
              Sign in
            </a>
            <a
              href="#dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      <section id="product" className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            Inventory operations, simplified
          </div>

          <h1 className="max-w-xl text-5xl font-bold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-6xl">
            Know what you have.
            <br />
            Know where it is.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            StockSense brings receipts, deliveries, transfers, adjustments, and stock history into one clear workflow.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Open dashboard <ArrowRight />
            </a>
            <a
              href="#workflow"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Explore workflow
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            {["Multi-warehouse visibility", "Live stock availability", "Complete audit trail"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <span className="text-emerald-600"><CheckIcon /></span>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div id="dashboard" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-white">
                  <BoxIcon />
                </span>
                <span className="text-sm font-bold">StockSense</span>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                Sep 2026
              </div>
            </div>

            <div className="grid min-h-[440px] grid-cols-[142px_1fr]">
              <aside className="hidden border-r border-slate-200 bg-white p-3 sm:block">
                <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</p>
                {["Dashboard", "Receipts", "Deliveries", "Transfers", "Adjustments", "Stock ledger"].map((item, index) => (
                  <div
                    key={item}
                    className={`mb-1 rounded-md px-2.5 py-2 text-xs font-medium ${index === 0 ? "bg-indigo-50 text-indigo-700" : "text-slate-600"
                      }`}
                  >
                    {item}
                  </div>
                ))}
              </aside>

              <div className="p-4 sm:p-5">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Inventory overview</h2>
                    <p className="mt-1 text-xs text-slate-500">Live view across all warehouses</p>
                  </div>
                  <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                    View ledger
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <MetricCard label="Products" value="248" />
                  <MetricCard label="In stock" value="1,482" tone="green" />
                  <MetricCard label="Pending receipts" value="6" tone="blue" />
                  <MetricCard label="Low stock" value="12" tone="amber" />
                </div>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-amber-900">Low stock needs attention</p>
                      <p className="mt-0.5 text-xs text-amber-800">3 items are at or below their reorder level.</p>
                    </div>
                    <button className="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm">
                      Review
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-bold">Recent stock activity</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Validated inventory movements</p>
                    </div>
                    <a href="#workflow" className="text-xs font-semibold text-indigo-600">View all</a>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 font-medium">Reference</th>
                          <th className="px-4 py-2.5 font-medium">Type</th>
                          <th className="px-4 py-2.5 font-medium">Product</th>
                          <th className="px-4 py-2.5 font-medium text-right">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="px-4 py-3 font-semibold">WH/IN/0001</td>
                          <td className="px-4 py-3"><Badge variant="green">Receipt</Badge></td>
                          <td className="px-4 py-3">Steel Rod</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">+100 kg</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold">WH/TR/0003</td>
                          <td className="px-4 py-3"><Badge variant="blue">Transfer</Badge></td>
                          <td className="px-4 py-3">Packaging Box</td>
                          <td className="px-4 py-3 text-right font-bold text-indigo-600">30 units</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold">WH/OUT/0002</td>
                          <td className="px-4 py-3"><Badge variant="amber">Delivery</Badge></td>
                          <td className="px-4 py-3">Office Chair</td>
                          <td className="px-4 py-3 text-right font-bold text-red-600">-20 units</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-semibold text-indigo-600">One source of truth</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              From scattered records to clear operations.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Receive accurately", "Capture incoming goods and put stock in the right warehouse.", "↓", "bg-emerald-50 text-emerald-700"],
              ["Move with confidence", "Track deliveries and internal transfers without losing visibility.", "↔", "bg-indigo-50 text-indigo-700"],
              ["Audit every change", "See the complete history of what moved, when, and why.", "□", "bg-amber-50 text-amber-700"],
            ].map(([title, description, icon, color]) => (
              <article key={title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                <div className={`grid h-10 w-10 place-items-center rounded-lg text-xl font-bold ${color}`}>{icon}</div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-indigo-600">A connected workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Every movement is visible.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
              StockSense turns each validated operation into a traceable ledger entry, so availability is always based on what actually happened.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            {[
              ["1", "Receipt", "Stock arrives"],
              ["2", "Available", "Live balance"],
              ["3", "Transfer", "Move internally"],
              ["4", "Delivery", "Stock leaves"],
              ["5", "Ledger", "Full history"],
            ].map(([number, title, text]) => (
              <div key={number} className="relative rounded-xl border border-slate-200 bg-white p-4">
                <span className="text-xs font-bold text-indigo-600">0{number}</span>
                <h3 className="mt-5 text-sm font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <p className="text-sm font-semibold text-indigo-300">Built for operations teams</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white">
            Bring clarity to every stock decision.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            Start with the workflow your warehouse team already understands.
          </p>
          <a
            href="#dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
          >
            Get started with StockSense <ArrowRight />
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-7 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-semibold text-white">
            <BoxIcon /> StockSense
          </div>
          <p>Clear inventory. Confident operations.</p>
          <div className="flex gap-5">
            <a href="#dashboard" className="hover:text-white">Dashboard</a>
            <a href="#product" className="hover:text-white">Products</a>
            <a href="#workflow" className="hover:text-white">Stock ledger</a>
          </div>
        </div>
      </footer>
    </main>
  );
}