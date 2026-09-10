import { WriteLetterShell } from "@/features/letter/ui/WriteLetterScreen";

export default function Loading() {
  return (
    <main className="flex flex-1 flex-col">
      <span role="status" className="sr-only">
        편지 쓰기 화면을 불러오는 중
      </span>

      <WriteLetterShell />
    </main>
  );
}
