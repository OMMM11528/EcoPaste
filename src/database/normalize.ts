import { copyFile, exists, remove } from "@tauri-apps/plugin-fs";
import { isString } from "es-toolkit";
import { getDefaultSaveImagePath } from "tauri-plugin-clipboard-x-api";
import type { DatabaseSchemaHistory } from "@/types/database";
import { getSaveImagePath, join } from "@/utils/path";

/**
 * Normalize a raw history item returned from the database:
 * - For `image` items, migrate legacy save paths to the current default
 *   image directory and resolve the absolute file path.
 * - For `files` items, parse the JSON-encoded file list.
 *
 * Mutates the item in place and returns it. This keeps the existing
 * contract of `useHistoryList` while isolating the I/O side effects
 * (file copy/remove) behind a single async helper.
 */
export const normalizeHistoryItem = async (
  item: DatabaseSchemaHistory,
): Promise<DatabaseSchemaHistory> => {
  const { type, value } = item;

  if (!isString(value)) return item;

  if (type === "image") {
    const oldPath = join(getSaveImagePath(), value);
    const newPath = join(await getDefaultSaveImagePath(), value);

    if (await exists(oldPath)) {
      await copyFile(oldPath, newPath);

      remove(oldPath);
    }

    item.value = newPath;
  }

  if (type === "files") {
    item.value = JSON.parse(value);
  }

  return item;
};

/**
 * Normalize a batch of history items in place.
 */
export const normalizeHistoryItems = async (
  items: DatabaseSchemaHistory[],
): Promise<DatabaseSchemaHistory[]> => {
  for (const item of items) {
    await normalizeHistoryItem(item);
  }

  return items;
};
