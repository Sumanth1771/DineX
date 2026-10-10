
import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    title: "Explore the menu",
    description:
      "Browse available dishes, view prices and choose what you want to eat.",
  },
  {
    number: "02",
    title: "Reserve your table",
    description:
      "Choose your dining date, time slot, party size and food items.",
  },
  {
    number: "03",
    title: "Pay securely",
    description:
      "Complete your reservation using the integrated Razorpay checkout.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#080f1e] text-white">
      <header className="relative z-10 border-b border-white/10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-lg font-black text-slate-950">
              D
            </div>
            <div>
              <p className="text-xl font-black tracking-wide">DineX</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                Your dining experience
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:px-4"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 sm:px-5"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute -right-40 -top-24 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-40 top-64 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:py-32">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Welcome to Uncle Mess
              </div>

              <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Good food.
                <br />
                Great moments.
                <br />
                <span className="text-amber-400">Your table.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
                Discover the menu at Uncle Mess, reserve your dining slot,
                select your favourite dishes and manage your bookings in one
                convenient place.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-4 font-bold text-slate-950 shadow-lg shadow-amber-400/10 transition hover:-translate-y-0.5 hover:bg-amber-300"
                >
                  Reserve your table
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-4 font-semibold text-white transition hover:bg-white/5"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  Easy reservations
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  Online payments
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span>
                  Booking history
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-5 rounded-[2rem] bg-amber-400/5 blur-2xl" />

              <div className="relative rounded-[2rem] border border-white/10 bg-[#111b2e] p-5 shadow-2xl shadow-black/30 sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-400">
                      The dining experience
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">
                      Your next meal
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl">
                    🍽️
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-[#080f1e] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-2xl">
                        🍛
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Choose your dishes</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Explore the available menu
                        </p>
                      </div>
                      <span className="text-amber-400">01</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#080f1e] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-400/10 text-2xl">
                        🗓️
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Pick your time</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Select an available dining slot
                        </p>
                      </div>
                      <span className="text-amber-400">02</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#080f1e] p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl">
                        ✓
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Confirm your booking</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Track your reservation online
                        </p>
                      </div>
                      <span className="text-amber-400">03</span>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-slate-500">
                  Simple booking. Clear pricing. Convenient dining.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-400">
                How DineX works
              </p>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                From browsing to booking, made simple.
              </h2>
              <p className="mt-4 leading-7 text-slate-400">
                Spend less time arranging your visit and more time enjoying
                your meal.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.number}
                  className="rounded-2xl border border-white/10 bg-[#111b2e] p-6 transition hover:-translate-y-1 hover:border-amber-400/30"
                >
                  <p className="text-sm font-bold tracking-widest text-amber-400">
                    {feature.number}
                  </p>
                  <h3 className="mt-5 text-xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-transparent p-7 sm:p-10 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold text-amber-400">
                Your next meal starts here
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Ready to dine with us?
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-400">
                Create an account to view the available menu and start your
                reservation at Uncle Mess.
              </p>
            </div>

            <Link
              to="/register"
              className="shrink-0 rounded-xl bg-amber-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-amber-300"
            >
              Create your account →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            <span className="font-bold text-white">DineX</span> · Uncle Mess
          </p>
          <p>Good food, made easier.</p>
        </div>
      </footer>
    </div>
  );
}
