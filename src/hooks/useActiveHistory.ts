import { useContext } from "react";
import { MainContext } from "@/pages/Main";

/**
 * 维护历史记录列表的选中项（activeId）。
 * 仅返回纯操作、不包含副作用，可安全地在列表与列表项中调用。
 */
export const useActiveHistory = () => {
  const { rootState } = useContext(MainContext);

  // 选中第一项
  const selectFirst = () => {
    rootState.activeId = rootState.list[0]?.id;
  };

  // 列表变化后维护选中项：为空则清空，否则默认选中第一项
  const ensureSelected = () => {
    const { list } = rootState;

    if (list.length === 0) {
      rootState.activeId = void 0;
    } else {
      rootState.activeId ??= list[0].id;
    }
  };

  // 选中上一项
  const selectPrev = (index: number) => {
    if (index === 0) return;

    rootState.activeId = rootState.list[index - 1].id;
  };

  // 选中下一项（到末尾则回退到上一项）
  const selectNext = (index: number) => {
    const { list } = rootState;

    const nextItem = list[index + 1] ?? list[index - 1];

    rootState.activeId = nextItem?.id;
  };

  return {
    ensureSelected,
    selectFirst,
    selectNext,
    selectPrev,
  };
};
