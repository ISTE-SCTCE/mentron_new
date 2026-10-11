import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        width: '90%',
        maxWidth: 420,
      }}>
        <AnimatePresence>
          {toasts.map(toast => {
            const isError = toast.type === 'error';
            const isSuccess = toast.type === 'success';
            const accentColor = isError ? '#D97D55' : isSuccess ? '#3AAFA9' : '#5F85A2';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.95 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                  pointerEvents: 'auto',
                  background: '#111111',
                  border: `1.5px solid ${accentColor}`,
                  borderRadius: 20,
                  padding: '12px 16px',
                  color: '#fff',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex' }}>
                  {isError ? (
                    <AlertCircle size={18} color="#D97D55" />
                  ) : isSuccess ? (
                    <CheckCircle2 size={18} color="#3AAFA9" />
                  ) : (
                    <Info size={18} color="#5F85A2" />
                  )}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
