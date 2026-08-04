import Image from "next/image";
import Link from "next/link";

function IconCourses() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6.5h16M4 12h10M4 17.5h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 4.5 7v5c0 4.5 3.2 7.4 7.5 8.5 4.3-1.1 7.5-4 7.5-8.5V7L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="miter"
      />
      <path
        d="M9.2 12.1 11 13.9l3.8-3.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="square"
      />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__ribbon">
        <span>Lahore College for Women University</span>
        <span className="site-header__ribbon-dot" aria-hidden />
        <span>Discipline Ensures Success</span>
      </div>

      <div className="site-header__bar">
        <Link href="/" className="site-header__brand">
          <Image
            src="/brand/lcwu-logo.png"
            alt="LCWU"
            width={230}
            height={58}
            className="site-header__logo"
            priority
          />
          <span className="site-header__title">
            <span className="site-header__name">Past Papers</span>
            <span className="site-header__meta">Computer Science · BSCS</span>
          </span>
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          <Link href="/#courses" className="nav-btn">
            <IconCourses />
            <span>Courses</span>
          </Link>
          <Link href="/admin" className="nav-btn">
            <IconAdmin />
            <span>Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
