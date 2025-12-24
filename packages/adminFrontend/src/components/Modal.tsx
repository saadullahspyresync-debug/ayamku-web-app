import React from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {/* Outer wrapper to make modal scrollable if content is too tall */}
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto bg-white rounded-2xl shadow-xl relative p-6">
        {/* Close button (X) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          &times;
        </button>

        {/* Modal content */}
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}
