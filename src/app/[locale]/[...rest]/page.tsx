import { notFound } from 'next/navigation';

// Any unknown address under a language gets that language's 404 page.
export default function CatchAll() {
  notFound();
}
