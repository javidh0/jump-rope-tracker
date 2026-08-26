import { createSession } from "@/lib/actions";
import SessionForm from "@/components/SessionForm";

export default function LogSessionPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Log a session</h1>
      <SessionForm action={createSession} submitLabel="Save session" />
    </div>
  );
}
