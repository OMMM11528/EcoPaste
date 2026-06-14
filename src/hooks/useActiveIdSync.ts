import { useUpdateEffect } from "ahooks";
import { useContext } from "react";
import { MainContext } from "@/pages/Main";

/**
 * Keep `rootState.activeId` in sync with `rootState.list`:
 * - When the list becomes empty, clear the active id.
 * - When the list grows from empty, select the first item.
 * - When items are removed, leave the existing selection alone
 *   (the Item-level `handleNext` / `handlePrev` already pick a neighbour).
 */
export const useActiveIdSync = () => {
  const { rootState } = useContext(MainContext);

  useUpdateEffect(() => {
    const { list } = rootState;

    if (list.length === 0) {
      rootState.activeId = void 0;
    } else {
      rootState.activeId ??= list[0].id;
    }
  }, [rootState.list.length]);
};
