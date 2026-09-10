/*
  CapsuleScreen 의 마운트 전 분기(useNow 가 null)도 헤더만 그린다. 여기서 카운트다운
  카드까지 그리면 loading → 서버 HTML 에서 카드가 사라졌다 다시 생긴다.
*/
export default function Loading() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-7 px-5 py-6">
        <span role="status" className="sr-only">
          캡슐을 불러오는 중
        </span>

        <header
          aria-hidden="true"
          className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
        >
          <span className="size-control rounded-full bg-surface" />
          <span className="mx-auto h-4 w-32 rounded-pill bg-surface" />
          <span className="size-control rounded-full bg-surface" />
        </header>
      </div>
    </main>
  );
}
