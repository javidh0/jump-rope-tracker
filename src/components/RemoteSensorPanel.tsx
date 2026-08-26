"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const POLL_MS = 300;

export type RemoteSensorHandle = {
  isArmed: () => boolean;
  startListening: (resetCount?: boolean) => Promise<boolean>;
  stopListening: () => void;
  getCount: () => number;
};

async function relayRequest(code: string, method: string): Promise<number | null> {
  try {
    const res = await fetch(`/api/remote/${code}/count`, { method });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.count === "number" ? data.count : null;
  } catch {
    return null;
  }
}

const RemoteSensorPanel = forwardRef<RemoteSensorHandle, { running: boolean }>(
  function RemoteSensorPanel(_props, ref) {
    const [code, setCode] = useState<string | null>(null);
    const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [connected, setConnected] = useState(false);
    const countRef = useRef(0);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const res = await fetch("/api/remote/create", { method: "POST" });
          const data = await res.json();
          if (cancelled) return;
          setCode(data.code);
          const host = data.lanAddresses?.[0];
          if (host) {
            setRemoteUrl(`${window.location.protocol}//${host}:${window.location.port}/remote`);
          }
        } catch {
          // leave code null — panel shows "not connected"
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    function startPolling() {
      if (!code || pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const latest = await relayRequest(code, "GET");
        if (latest != null) {
          countRef.current = latest;
          setCount(latest);
          setConnected(true);
        }
      }, POLL_MS);
    }

    function stopPolling() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    useEffect(() => stopPolling, []);

    useImperativeHandle(ref, () => ({
      isArmed: () => code != null,
      startListening: async (resetCount = true) => {
        if (!code) return false;
        if (resetCount) {
          await relayRequest(code, "PUT");
          countRef.current = 0;
          setCount(0);
        }
        startPolling();
        return true;
      },
      stopListening: () => {
        stopPolling();
      },
      getCount: () => countRef.current,
    }));

    if (!code) {
      return (
        <div className="flex flex-col gap-1 rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
          <span className="font-medium">Remote sensor (iPhone)</span>
          <span>Connecting…</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Remote sensor (iPhone)</span>
          <span className="text-xs text-zinc-500">
            On your iPhone, visit{" "}
            <span className="font-mono">{remoteUrl ?? "…/remote"}</span> and
            enter code
          </span>
          <span className="self-start rounded-md bg-zinc-100 px-3 py-1 font-mono text-2xl tracking-widest dark:bg-zinc-900">
            {code}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{connected ? "Connected" : "Waiting for phone…"}</span>
          {connected && (
            <span className="font-mono text-lg text-zinc-900 dark:text-white">
              {count}
            </span>
          )}
        </div>
      </div>
    );
  }
);

export default RemoteSensorPanel;
