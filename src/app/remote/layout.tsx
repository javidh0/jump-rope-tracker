import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jump Rope Remote",
  // Lets iPhone Safari run this page in standalone (chrome-free) mode when
  // added to the Home Screen — the real equivalent of "fullscreen" on
  // iPhone, since Safari there doesn't support the Fullscreen API at all
  // (unlike iPad/desktop, where requestFullscreen() just works).
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jump Rope Remote",
  },
};

export default function RemoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
