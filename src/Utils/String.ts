import { User } from "@prisma/client";

function FormatFileSize(bytes: number, decimals = 2): string {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function ReplacePlaceholders(str: string, user: User) {
  return str
    .replaceAll("{username}", user.username)
    .replaceAll("{uploads}", user.uploads.toString())
    .replaceAll("{storageused}", FormatFileSize(user.storageUsed));
  // Idk how to fix it (i know but i'm lazy)
  // .replaceAll("{discord}", user.discord.username);
}

export { ReplacePlaceholders };
