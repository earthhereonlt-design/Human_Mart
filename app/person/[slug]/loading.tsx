import { SkeletonGrid } from "@/components/states/EmptyState";

export default function Loading() {
  return (
    <div className="container-page py-10 md:py-20">
      <div className="h-8 w-56 border-2 border-dashed border-ink/35" />
      <div className="mt-12">
        <SkeletonGrid />
      </div>
    </div>
  );
}
