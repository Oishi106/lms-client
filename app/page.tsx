import {
  About,
  Categories,
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
        <GetInTouch />
      </main>
      <Footer />
    </>
  );
}
