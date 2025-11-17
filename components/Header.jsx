import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();

  return (
    <header className="site-header">
      <div className="logo">
        <Link href="/">
          <a>NovaHunt</a>
        </Link>
      </div>
      <nav>
        <Link href="/search">
          <a>Search</a>
        </Link>
        <Link href="/about">
          <a>About</a>
        </Link>

        {/* Make the CTA a real navigation link */}
        <a
          href="/signin"
          onClick={(e) => {
            e.preventDefault();
            router.push('/signin');
          }}
        >
          Sign in to see all
        </a>
      </nav>
    </header>
  );
}
