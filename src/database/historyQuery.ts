import type { AnyObject } from "antd/es/_util/type";
import type { SelectQueryBuilder } from "kysely";
import type { DatabaseSchema, DatabaseSchemaGroupId } from "@/types/database";
import { isBlank } from "@/utils/is";

type QueryBuilder = SelectQueryBuilder<DatabaseSchema, "history", AnyObject>;

export interface HistoryQueryFilters {
  group: DatabaseSchemaGroupId;
  search?: string;
}

/**
 * Apply group and search filters to a Kysely select query builder.
 *
 * This is a pure helper so that `useHistoryList` and any future caller
 * (e.g. export / search previews) share identical filter semantics.
 */
export const applyHistoryFilters = (
  qb: QueryBuilder,
  filters: HistoryQueryFilters,
): QueryBuilder => {
  const { group, search } = filters;
  const isFavoriteGroup = group === "favorite";
  const isNormalGroup = group !== "all" && !isFavoriteGroup;

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
    });
};
