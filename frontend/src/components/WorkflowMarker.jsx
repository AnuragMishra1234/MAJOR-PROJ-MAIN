import React from 'react';
import { motion } from 'framer-motion';

/**
 * WorkflowMarker
 * Subtle spatial badge / node component for editorial scrollytelling.
 * Renders minimalist tags, status indicators, and hairline connectors.
 */
export default function WorkflowMarker({
  label,
  sublabel,
  icon: Icon,
  status = 'default', // 'default' | 'active' | 'success' | 'warning' | 'error' | 'healed'
  className = '',
  style = {},
  variant = 'pill', // 'pill' | 'tag' | 'spatial'
}) {
  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-white/80 dark:bg-black/40',
          border: 'border-black/30 shadow-sm',
          text: 'text-black/90 font-medium',
          dot: 'bg-blue-600 animate-pulse',
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/80 backdrop-blur-md',
          border: 'border-emerald-500/30',
          text: 'text-emerald-950 font-medium',
          dot: 'bg-emerald-600',
        };
      case 'error':
        return {
          bg: 'bg-rose-50/85 backdrop-blur-md',
          border: 'border-rose-500/40',
          text: 'text-rose-950 font-medium',
          dot: 'bg-rose-600 animate-ping',
        };
      case 'healed':
        return {
          bg: 'bg-indigo-50/90 backdrop-blur-md',
          border: 'border-indigo-500/40 shadow-sm',
          text: 'text-indigo-950 font-medium',
          dot: 'bg-indigo-600',
        };
      default:
        return {
          bg: 'bg-white/40 backdrop-blur-md',
          border: 'border-white/50',
          text: 'text-black/75',
          dot: 'bg-black/30',
        };
    }
  };

  const currentStatus = getStatusStyles();

  if (variant === 'tag') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] tracking-wider uppercase font-mono font-medium border ${currentStatus.bg} ${currentStatus.border} ${currentStatus.text} ${className}`}
        style={style}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
        <span>{label}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs tracking-tight shadow-sm border ${currentStatus.bg} ${currentStatus.border} ${className}`}
      style={style}
    >
      {Icon ? (
        <Icon className="w-3.5 h-3.5 text-black/70 flex-shrink-0" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${currentStatus.dot}`} />
      )}
      <div className="flex flex-col text-left">
        <span className={`text-[11px] font-semibold tracking-tight uppercase ${currentStatus.text}`}>
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-black/50 font-mono tracking-tight -mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </motion.div>
  );
}
