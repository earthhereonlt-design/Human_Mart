import { SkeletonGrid } from "@/components/states/EmptyState";

export default function Loading() {
  return (
    <div className="container-page py-10 md:py-20">
      <div className="h-8 w-48 border-2 border-dashed border-ink/35" />
      <div className="mt-12">
        <SkeletonGrid count={4} />
      </div>
    </div>
  );
}
