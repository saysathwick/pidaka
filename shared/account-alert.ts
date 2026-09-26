export type AccountAlertKind =
  | "account_request_deactivate"
  | "account_request_delete"
  | "account_deactivated"
  | "account_deleted"
  | "account_activated"
  | "account_suspended"
  | "account_unsuspended";

export type AccountAlertPayload = {
  kind: AccountAlertKind;
  title: string;
  body: string;
};

const COPY: Record<AccountAlertKind, { title: string; body: string }> = {
  account_request_deactivate: {
    title: "Pidaka",
    body: "Your deactivate request was sent. Your account will be archived.",
  },
  account_request_delete: {
    title: "Pidaka",
    body: "Your delete request was sent. Your account will be permanently deleted.",
  },
  account_deactivated: {
    title: "Pidaka",
    body: "Your account was archived. Sign in later to ask the keepers to open it again.",
  },
  account_deleted: {
    title: "Pidaka",
    body: "Your account was permanently deleted.",
  },
  account_activated: {
    title: "Pidaka",
    body: "Your name is active again. You can sign in.",
  },
  account_suspended: {
    title: "Pidaka",
    body: "Your name was suspended by the keepers.",
  },
  account_unsuspended: {
    title: "Pidaka",
    body: "Your name is no longer suspended. You can sign in.",
  },
};

export function accountAlertPayload(kind: AccountAlertKind): AccountAlertPayload {
  const copy = COPY[kind];
  return { kind, title: copy.title, body: copy.body };
}
