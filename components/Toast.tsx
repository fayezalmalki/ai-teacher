interface ToastProps {
  message: string;
}

/** v2 toast: yellow, ink border, flat shadow, pops in at the bottom center. */
export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed bottom-7 right-1/2 translate-x-1/2 px-5 py-3 r-input ink-2 bg-yellow text-[14px] font-semibold shadow-pop-sm motion animate-pop-in-fast z-20"
    >
      {message}
    </div>
  );
}
