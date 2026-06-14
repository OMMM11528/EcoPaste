import { useUpdateEffect } from "ahooks";
import { FloatButton, Modal } from "antd";
import clsx from "clsx";
import { useContext, useRef } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import Scrollbar from "@/components/Scrollbar";
import { LISTEN_KEY } from "@/constants";
import { useActiveHistory } from "@/hooks/useActiveHistory";
import { useHistoryList } from "@/hooks/useHistoryList";
import { useHistoryScroll } from "@/hooks/useHistoryScroll";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useTauriListen } from "@/hooks/useTauriListen";
import { MainContext } from "../..";
import Item from "./components/Item";
import NoteModal, { type NoteModalRef } from "./components/NoteModal";

const HistoryList = () => {
  const { rootState } = useContext(MainContext);
  const noteModelRef = useRef<NoteModalRef>(null);
  const [deleteModal, contextHolder] = Modal.useModal();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const { scrollToIndex } = useHistoryScroll(virtuosoRef);
  const { ensureSelected, selectFirst } = useActiveHistory();

  const scrollToTop = () => {
    if (rootState.list.length === 0) return;

    scrollToIndex(0);

    selectFirst();
  };

  useKeyboard({ scrollToTop });

  const { reload, loadMore } = useHistoryList({ scrollToTop });

  useTauriListen(LISTEN_KEY.ACTIVATE_BACK_TOP, scrollToTop);

  useUpdateEffect(ensureSelected, [rootState.list.length]);

  return (
    <>
      <Scrollbar className="flex-1" offsetX={3} ref={scrollerRef}>
        <Virtuoso
          atTopStateChange={(atTop) => {
            if (!atTop || rootState.list.length <= 20) return;

            reload();
          }}
          computeItemKey={(_, item) => item.id}
          customScrollParent={scrollerRef.current ?? void 0}
          data={rootState.list}
          endReached={loadMore}
          itemContent={(index, data) => {
            return (
              <div className={clsx({ "pt-3": index !== 0 })}>
                <Item
                  data={data}
                  deleteModal={deleteModal}
                  handleNote={() => noteModelRef.current?.open(data.id)}
                  index={index}
                />
              </div>
            );
          }}
          ref={virtuosoRef}
        />
      </Scrollbar>

      <NoteModal ref={noteModelRef} />

      <FloatButton.BackTop
        duration={0}
        onClick={scrollToTop}
        target={() => scrollerRef.current!}
      />

      {contextHolder}
    </>
  );
};

export default HistoryList;
