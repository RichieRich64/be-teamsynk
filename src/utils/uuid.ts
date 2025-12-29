// import { v4 as uuidv4 } from "uuid";

import { randomBytes } from "crypto";
// export function generateInviteCode() {
//   return uuidv4().replace(/-/g, "").substring(0, 8);
// }

// export function generateTaskCode() {
//   return `task-${uuidv4().replace(/-/g, "").substring(0, 3)}`;
// }

const ALPHANUM = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomAlphaNum(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUM[bytes[i] % ALPHANUM.length];
  }
  return out;
}

export function generateInviteCode(): string {
  // 8-character alphanumeric code
  return randomAlphaNum(8);
}

export function generateTaskCode(): string {
  // short task code, e.g. "task-abc"
  return `task-${randomAlphaNum(3)}`;
}
