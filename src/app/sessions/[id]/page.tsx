import { notFound } from "next/navigation";
import { deleteSession, getSession, updateSession } from "@/lib/actions";
import SessionForm from "@/components/SessionForm";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const updateWithId = updateSession.bind(null, id);
  const deleteWithId = deleteSession.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit session</h1>
        <form action={deleteWithId}>
          <button
            type="submit"
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </form>
      </div>
      <SessionForm
        action={updateWithId}
        session={session}
        calibrationTest={session.calibrationTest}
        submitLabel="Save changes"
      />
    </div>
  );
}
