import { networkInterfaces } from "node:os";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/remoteSensor";

function lanAddresses(): string[] {
  const nets = networkInterfaces();
  const addresses: string[] = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

export async function POST() {
  const code = createSession();
  return NextResponse.json({ code, lanAddresses: lanAddresses() });
}
