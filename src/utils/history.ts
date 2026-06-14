import { copyFile, exists, remove } from "@tauri-apps/plugin-fs";
import { isString } from "es-toolkit";
import { getDefaultSaveImagePath } from "tauri-plugin-clipboard-x-api";
import type { HistoryQueryBuilder } from "@/database/history";
import type {
  DatabaseSchemaGroupId,
  DatabaseSchemaHistory,
} from "@/types/database";
import { isBlank } from "@/utils/is";
import { getSaveImagePath, join } from "@/utils/path";

interface HistoryQueryParams {
  group: DatabaseSchemaGroupId;
  search?: string;
  page: number;
  size: number;
}

/**
 * 构建历史记录列表的查询条件（分组 / 收藏 / 搜索过滤 + 分页 + 排序）
 */
export const createHistoryQuery = (params: HistoryQueryParams) => {
  const { group, search, page, size } = params;

  const isFavoriteGroup = group === "favorite";
  const isNormalGroup = group !== "all" && !isFavoriteGroup;

  return (qb: HistoryQueryBuilder) => {
    return qb
      .$if(isFavoriteGroup, (eb) => eb.where("favorite", "=", true))
      .$if(isNormalGroup, (eb) => eb.where("group", "=", group))
      .$if(!isBlank(search), (eb) => {
        return eb.where((eb) => {
          return eb.or([
            eb("search", "like", eb.val(`%${search}%`)),
            eb("note", "like", eb.val(`%${search}%`)),
          ]);
        });
      })
      .offset((page - 1) * size)
      .limit(size)
      .orderBy("createTime", "desc");
  };
};

/**
 * 归一化历史记录列表：迁移图片旧路径、解析 files 的 JSON 值。
 * 直接在原对象上修改并返回同一引用。
 */
export const normalizeHistory = async (list: DatabaseSchemaHistory[]) => {
  let defaultImagePath: string | undefined;

  for (const item of list) {
    const { type, value } = item;

    if (!isString(value)) continue;

    if (type === "image") {
      defaultImagePath ??= await getDefaultSaveImagePath();

      const oldPath = join(getSaveImagePath(), value);
      const newPath = join(defaultImagePath, value);

      if (await exists(oldPath)) {
        await copyFile(oldPath, newPath);

        remove(oldPath);
      }

      item.value = newPath;
    }

    if (type === "files") {
      item.value = JSON.parse(value);
    }
  }

  return list;
};
