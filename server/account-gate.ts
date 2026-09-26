import { storage } from "./storage";
import type { ArchivedAccountRow } from "@shared/schema";

export async function blockIfPendingAccountChange(userId: string): Promise<string | null> {
  const pending = await storage.getPendingAccountRequestForUser(userId);
  if (!pending) return null;
  if (pending.kind === "delete") {
    return "A delete request is waiting with the keepers. Sign-in is closed until they act.";
  }
  if (pending.kind === "deactivate") {
    return "A deactivate request is waiting with the keepers. Sign-in is closed until they act.";
  }
  if (pending.kind === "activate") {
    return "A reactivation request is waiting with the keepers. Try again after they open your name.";
  }
  return "An account request is waiting with the keepers.";
}

export async function handleArchivedSignIn(archived: ArchivedAccountRow): Promise<{
  status: number;
  message: string;
}> {
  if (archived.status === "deleted") {
    return {
      status: 403,
      message: "That name was deleted. It cannot come back.",
    };
  }
  if (archived.status === "suspended") {
    return {
      status: 403,
      message: "That name is suspended by the keepers.",
    };
  }
  await storage.createActivateRequest(archived);
  return {
    status: 403,
    message: "That name is deactivated. A reactivation request was sent to the keepers.",
  };
}

export async function gateLiveUserSignIn(userId: string): Promise<string | null> {
  return blockIfPendingAccountChange(userId);
}

export async function gateEmailSignIn(email: string): Promise<{ status: number; message: string } | null> {
  const archived = await storage.findArchivedByEmail(email);
  if (archived) return handleArchivedSignIn(archived);
  return null;
}

export async function gatePhoneSignIn(phone: string): Promise<{ status: number; message: string } | null> {
  const archived = await storage.findArchivedByPhone(phone);
  if (archived) return handleArchivedSignIn(archived);
  return null;
}

export async function gateAuthSignIn(
  provider: string,
  subject: string,
): Promise<{ status: number; message: string } | null> {
  const archived = await storage.findArchivedByAuth(provider, subject);
  if (archived) return handleArchivedSignIn(archived);
  return null;
}
