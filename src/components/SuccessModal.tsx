import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  details?: { label: string; value: string }[];
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  details
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="p-8 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
            
            {message && (
              <p className="text-gray-600 mb-6">{message}</p>
            )}

            {details && details.length > 0 && (
              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-3 text-left border border-gray-100">
                {details.map((detail, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{detail.label}</span>
                    <span className="text-lg font-semibold text-gray-900 font-mono">{detail.value}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-8 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SuccessModal;
