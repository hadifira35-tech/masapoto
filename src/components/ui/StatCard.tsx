import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
}) => {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-[11px] text-zinc-500 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
