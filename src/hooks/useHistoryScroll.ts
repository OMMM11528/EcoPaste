import { findIndex } from "es-toolkit/compat";
import { type RefObject, useContext, useEffect } from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import { MainContext } from "@/pages/Main";

/**
 * 历史记录列表的滚动控制：滚动到指定项，并在 activeId 变化时滚动到当前项。
 */
export const useHistoryScroll = (
  virtuosoRef: RefObject<VirtuosoHandle | null>,
) => {
  const { rootState } = useContext(MainContext);

  const scrollToIndex = (index: number) => {
    return virtuosoRef.current?.scrollIntoView({ index });
  };

  useEffect(() => {
    const { list, activeId } = rootState;

    if (!activeId) return;

    const index = findIndex(list, { id: activeId });

    if (index < 0) return;

    scrollToIndex(index);
  }, [rootState.activeId]);

  return {
    scrollToIndex,
  };
};
