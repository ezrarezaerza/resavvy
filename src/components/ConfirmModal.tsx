import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel" 
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-300 font-medium">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { 
              onConfirm(); 
              onClose(); 
            }} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
