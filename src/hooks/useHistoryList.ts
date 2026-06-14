import { useAsyncEffect, useReactive } from "ahooks";
import { unionBy } from "es-toolkit/compat";
import { useContext } from "react";
import { LISTEN_KEY } from "@/constants";
import { selectHistory } from "@/database/history";
import { useActiveHistory } from "@/hooks/useActiveHistory";
import { MainContext } from "@/pages/Main";
import { createHistoryQuery, normalizeHistory } from "@/utils/history";
import { useTauriListen } from "./useTauriListen";

interface Options {
  scrollToTop: () => void;
}

export const useHistoryList = (options: Options) => {
  const { scrollToTop } = options;
  const { rootState } = useContext(MainContext);
  const { selectFirst } = useActiveHistory();
  const state = useReactive({
    loading: false,
    noMore: false,
    page: 1,
    size: 20,
  });

  const fetchData = async () => {
    try {
      if (state.loading) return;

      state.loading = true;

      const { page, size } = state;
      const { group, search } = rootState;

      const list = await selectHistory(
        createHistoryQuery({ group, page, search, size }),
      );

      await normalizeHistory(list);

      state.noMore = list.length === 0;

      if (page === 1) {
        rootState.list = list;

        if (state.noMore) return;

        return scrollToTop();
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

  useTauriListen(LISTEN_KEY.REFRESH_CLIPBOARD_LIST, reload);

  useAsyncEffect(async () => {
    await reload();

    selectFirst();
  }, [rootState.group, rootState.search]);

  return {
    loadMore,
    reload,
  };
};
