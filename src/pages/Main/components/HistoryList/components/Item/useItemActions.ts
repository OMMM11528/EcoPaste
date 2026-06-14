import { openPath } from "@tauri-apps/plugin-opener";
import { useContext } from "react";
import { LISTEN_KEY } from "@/constants";
import { useContextMenu } from "@/hooks/useContextMenu";
import { MainContext } from "@/pages/Main";
import { pasteToClipboard } from "@/plugins/clipboard";
import type { ItemProps } from ".";

/**
 * Encapsulate all imperative actions for a single history list item:
 * - Keyboard/event-bus dispatch (preview, paste, delete, select, favorite)
 * - Context-menu integration (delete, favorite)
 * - Neighbour selection helpers used after deletion
 *
 * Keeping this in a dedicated hook prevents the Item component's render
 * body from mixing subscription wiring with JSX layout.
 */
export const useItemActions = (props: ItemProps) => {
  const { index, data } = props;
  const { id, type, value } = data;
  const { rootState } = useContext(MainContext);

  const handlePreview = () => {
    if (type !== "image") return;

    openPath(value);
  };

  const handleNext = () => {
    const { list } = rootState;

    const nextItem = list[index + 1] ?? list[index - 1];

    rootState.activeId = nextItem?.id;
  };

  const handlePrev = () => {
    if (index === 0) return;

    rootState.activeId = rootState.list[index - 1].id;
  };

  const handlePaste = () => {
    pasteToClipboard(data);
  };

  const { handleContextMenu, handleDelete, handleFavorite } = useContextMenu({
    ...props,
    handleNext,
  });

  // Route event-bus actions targeted at this item to the right handler.
  rootState.eventBus?.useSubscription((payload) => {
    if (payload.id !== id) return;

    switch (payload.action) {
      case LISTEN_KEY.CLIPBOARD_ITEM_PREVIEW:
        return handlePreview();
      case LISTEN_KEY.CLIPBOARD_ITEM_PASTE:
        return handlePaste();
      case LISTEN_KEY.CLIPBOARD_ITEM_DELETE:
        return handleDelete();
      case LISTEN_KEY.CLIPBOARD_ITEM_SELECT_PREV:
        return handlePrev();
      case LISTEN_KEY.CLIPBOARD_ITEM_SELECT_NEXT:
        return handleNext();
      case LISTEN_KEY.CLIPBOARD_ITEM_FAVORITE:
        return handleFavorite();
    }
  });

  return {
    handleContextMenu,
    handleDelete,
    handleFavorite,
  };
};
