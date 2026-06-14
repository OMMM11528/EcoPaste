import { useAsyncEffect, useReactive } from "ahooks";
import { unionBy } from "es-toolkit/compat";
import { useContext } from "react";
import { LISTEN_KEY } from "@/constants";
import { selectHistory } from "@/database/history";
import { applyHistoryFilters } from "@/database/historyQuery";
import { normalizeHistoryItems } from "@/database/normalize";
import { MainContext } from "@/pages/Main";
import { useTauriListen } from "./useTauriListen";

const PAGE_SIZE = 20;

interface UseHistoryListOptions {
  /**
   * Scroll the list so the first item is visible and mark it active.
   * Called after a page-1 reload when results are available.
   */
  scrollToTop: () => void;
}

export const useHistoryList = (options: UseHistoryListOptions) => {
  const { scrollToTop } = options;
  const { rootState } = useContext(MainContext);

  const state = useReactive({
    loading: false,
    noMore: false,
    page: 1,
    size: PAGE_SIZE,
  });

  const fetchData = async () => {
    if (state.loading) return;

    state.loading = true;

    try {
      const { page, size } = state;
      const { group, search } = rootState;

      const list = await selectHistory((qb) => {
        return applyHistoryFilters(qb, { group, search })
          .offset((page - 1) * size)
          .limit(size)
          .orderBy("createTime", "desc");
      });

      await normalizeHistoryItems(list);

      state.noMore = list.length === 0;

      if (page === 1) {
        rootState.list = list;

        if (!state.noMore) {
          scrollToTop();
        }

        return;
      }

      rootState.list = unionBy(rootState.list, list, "id");
    } finally {
      state.loading = false;
    }
  };

  const reload = () => {
    state.page = 1;
    state.noMore = false;

    return fetchData();
  };

  const loadMore = () => {
    if (state.noMore) return;

    state.page += 1;

    fetchData();
  };

  // Reload whenever the active group or search term changes, and
  // select the first item so keyboard navigation has a starting point.
  useAsyncEffect(async () => {
    await reload();

    rootState.activeId = rootState.list[0]?.id;
  }, [rootState.group, rootState.search]);

  useTauriListen(LISTEN_KEY.REFRESH_CLIPBOARD_LIST, reload);

  return {
    loadMore,
    reload,
  };
};
