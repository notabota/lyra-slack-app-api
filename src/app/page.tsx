import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Home Page</h1>
      <Link href="/about">Go to About page</Link>
      <br />
      <Link href="/refine/">Go to Refine page</Link>
    </main>
  );
}