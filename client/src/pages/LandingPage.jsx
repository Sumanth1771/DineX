import { Link } from "react-router-dom";
import heroImage from "../assets/hero.png";

const steps = [
  ["01", "Choose your time", "Pick a 45-minute lunch slot or dinner table."],
  ["02", "Build your plate", "Select exactly what you want from Uncle Mess."],
  ["03", "Arrive happy", "Pay in advance and skip the waiting line."],
];

export default function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden text-white">
      <nav className="landing-nav mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="brand-lockup">
          Dine<span>X</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/login" className="landing-link hidden sm:inline-flex">Log in</Link>
          <Link to="/reserve" className="landing-button landing-button-small">Start a booking</Link>
        </div>
      </nav>

      <section className="landing-hero mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:pb-32 lg:pt-20">
        <div className="relative z-10">
          <p className="landing-kicker">UNCLE MESS · BENGALURU</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.08em] sm:text-7xl lg:text-[6.4rem]">
            Your table.
            <br />
            <em>On time.</em>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#bcb0af] sm:text-lg">
            The easiest way to enjoy the food everyone is talking about.
            Choose your slot, pre-order your meal, and walk in like a regular.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/reserve" className="landing-button">Reserve your table <span>↗</span></Link>
            <span className="text-sm text-[#887e80]">No queues. No guessing.</span>
          </div>
          <div className="mt-14 flex flex-wrap gap-8 text-sm text-[#bcb0af]">
            <span><strong className="text-white">45 min</strong><br />lunch slots</span>
            <span><strong className="text-white">₹40+</strong><br />homestyle meals</span>
            <span><strong className="text-white">100%</strong><br />secure checkout</span>
          </div>
        </div>

        <div className="landing-stage" aria-hidden="true">
          <div className="landing-stage-glow" />
          <div className="landing-ring landing-ring-one" />
          <div className="landing-ring landing-ring-two" />
          <div className="landing-orb">
            <img src={heroImage} alt="" />
            <span className="landing-orb-label">EAT<br />WELL</span>
          </div>
          <div className="landing-float-card landing-float-top">
            <span className="status-dot" /> Tables open today
          </div>
          <div className="landing-float-card landing-float-bottom">
            <span className="text-xl">✦</span>
            <div><strong>Meals from ₹40</strong><small>Made fresh at Uncle Mess</small></div>
          </div>
        </div>
      </section>

      <section className="landing-steps border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <p className="landing-kicker">HOW DINE X WORKS</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <article key={number} className="landing-step">
                <span>{number}</span>
                <h2>{title}</h2>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-[#887e80]">
        DineX · A calmer way to eat at Uncle Mess
      </footer>
    </main>
  );
}
