import { SkeletonGrid } from "@/components/states/EmptyState";

export default function Loading() {
  return (
    <div className="container-page py-14 md:py-20">
      <div className="h-10 w-64 border-2 border-dashed border-ink/35" />
      <div className="mt-10 h-13 border-2 border-dashed border-ink/25" />
      <div className="mt-12">
        <SkeletonGrid />
      </div>
    </div>
  );
}
