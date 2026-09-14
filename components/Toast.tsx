interface ToastProps {
  message: string;
}

/** Dark bottom-center pill toast inside the frame. */
export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="absolute bottom-6 right-1/2 translate-x-1/2 px-5 py-3 rounded-pill bg-dark text-white text-[14px] shadow-toast animate-[fadeUp_.25s_ease]"
    >
      {message}
    </div>
  );
}
