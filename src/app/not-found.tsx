import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col px-5 pt-[100px] pb-7">
      <div className="flex-1">
        <h1 className="text-4xl font-bold tracking-[-0.01em] text-ink">
          캡슐을 찾을 수 없어요
        </h1>
        <p className="mt-3.5 text-sm leading-[1.6] font-medium text-ink-muted">
          링크가 잘못되었거나
          <br />
          사라진 캡슐이에요.
        </p>
      </div>

      <Link
        href="/"
        className="flex h-cta w-full items-center justify-center rounded-button bg-accent text-base font-semibold text-bg"
      >
        메인으로
      </Link>
    </main>
  );
}
