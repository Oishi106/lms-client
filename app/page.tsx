import {
  About,
  Categories,
  Contact,
  Explore,
  FAQ,
  Footer,
  GetInTouch,
  Hero,
  Instructors,
  Navbar,
  Process,
} from "./components/landing";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Explore />
        <Categories />
        <Instructors />
        <FAQ />
        <About />
        <Process />
        <Contact />
        <GetInTouch />
      </main>
      <Footer />
    </>
  );
}
