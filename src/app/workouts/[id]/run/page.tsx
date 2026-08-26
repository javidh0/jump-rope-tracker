import { notFound } from "next/navigation";
import { getWorkout } from "@/lib/actions";
import WorkoutRunner from "@/components/WorkoutRunner";

export default async function WorkoutRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();

  return <WorkoutRunner workout={workout} />;
}
