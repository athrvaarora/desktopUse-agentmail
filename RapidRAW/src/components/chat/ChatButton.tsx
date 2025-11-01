import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export const ChatButton = ({ onClick, isOpen }: ChatButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full bg-black hover:bg-gray-900 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      aria-label="Open chat"
    >
      <MessageSquare className="w-6 h-6 text-white" />
    </motion.button>
  );
};
