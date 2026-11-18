import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet on mobile, centered dialog on desktop. Built on the native
 * <dialog> element, so focus trapping, Esc-to-close and the top layer come free.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
      className="m-0 mt-auto w-full max-w-none max-h-[85dvh] rounded-t-2xl bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-inverse-surface/40 backdrop:backdrop-blur-sm open:animate-sheetUp lg:m-auto lg:max-w-lg lg:rounded-2xl lg:open:animate-fadeIn"
    >
      <div className="flex flex-col max-h-[85dvh] pb-safe">
        <div className="flex items-center justify-between px-space-md pt-space-md pb-space-sm">
          <h2 className="font-title-md text-[16px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        <div className="overflow-y-auto px-space-md pb-space-md">{children}</div>
      </div>
    </dialog>
  );
}
