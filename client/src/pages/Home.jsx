import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    title: "Explore the menu",
    description: "Browse available dishes and choose your favourites.",
  },
  {
    number: "02",
    title: "Reserve your table",
    description: "Choose your date, time slot, and number of guests.",
  },
  {
    number: "03",
    title: "Pay securely",
    description: "Complete your booking through Razorpay checkout.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-2xl font-black tracking-tight">
          Dine<span className="text-amber-400">X</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/10"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
          >
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
            A smarter way to dine
          </p>

          <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Good food.
            <br />
            Great moments.
            <br />
            <span className="text-amber-400">Made simple.</span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
            Discover the menu at Uncle Mess, reserve your table, and make
            your next meal effortless with DineX.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/register"
              className="rounded-xl bg-amber-400 px-6 py-3.5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-300"
            >
              Book your table →
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold hover:bg-white/10"
            >
              I have an account
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Simple reservations · Secure online payments
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-8 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">WELCOME TO</p>
                <h2 className="mt-1 text-3xl font-black">
                  Uncle <span className="text-amber-400">Mess</span>
                </h2>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                Table reservations
              </span>
            </div>

            <div className="my-8 rounded-2xl border border-white/10 bg-[#111a2d] p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-semibold">Your next meal</span>
                <span className="text-amber-400">✦</span>
              </div>

              <div className="space-y-4">
                {[
                  ["01", "Choose your dishes"],
                  ["02", "Select a time slot"],
                  ["03", "Confirm your booking"],
                ].map(([number, title]) => (
                  <div
                    key={number}
                    className="flex items-center gap-4 rounded-xl bg-white/[0.04] p-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 font-bold text-amber-400">
                      {number}
                    </span>
                    <span className="text-sm font-medium">{title}</span>
                    <span className="ml-auto text-slate-500">→</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-400">
              Your table, your time, your meal — all in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Three steps to a better meal.
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <span className="text-sm font-bold text-amber-400">
                  {feature.number}
                </span>
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} DineX · Made for Uncle Mess
      </footer>
    </main>
  );
}