export default function GetInTouch() {
  return (
    <section className="touch-cta" id="get-in-touch">
      <div className="touch-cta-overlay" />
      <div className="container">
        <div className="touch-cta-inner">
          <h2 className="touch-cta-title">GET IN TOUCH WITH US</h2>
          <p className="touch-cta-sub">
            There are many variations of passages of Lorem Ipsum available, but
            the majority have suffered alteration in some form.
          </p>

          <form className="touch-cta-form" action="#" method="post">
            <input
              className="touch-cta-input"
              type="email"
              placeholder="Your Email Address"
              required
            />
            <button className="touch-cta-btn" type="submit">
              SUBSCRIBE
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
