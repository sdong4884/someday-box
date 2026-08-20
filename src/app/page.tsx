import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-5 pt-[100px] pb-7">
      <div className="flex items-center gap-[18px]">
        <SparkleIcon className="size-5 text-accent-soft opacity-85" />
        <MoonIcon className="mx-2 size-[42px] text-accent-soft opacity-90" />
        <SparkleIcon className="size-3.5 text-accent opacity-85" />
      </div>

      <div className="flex-1">
        <h1 className="mt-20 text-4xl font-bold tracking-[-0.01em] text-ink">
          SOMEDAY BOX
        </h1>
        <p className="mt-3.5 max-w-[280px] text-sm leading-[1.6] font-medium text-ink-muted">
          마음을 담아 남긴 편지가,
          <br />
          정해둔 날에
          <br />다 함께 열려요.
        </p>
      </div>
      <Link
        href="/new"
        className="flex h-cta w-full items-center justify-center rounded-button bg-accent text-base font-semibold text-bg"
      >
        캡슐 만들기
      </Link>
    </main>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13 3l1.4 3.6L18 8l-3.6 1.4L13 13l-1.4-3.6L8 8l3.6-1.4L13 3z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}
