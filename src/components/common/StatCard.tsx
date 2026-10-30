import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-slate-100 text-slate-700',
  onClick,
  variant = 'default',
}) => {
  let borderHover = 'border-slate-200 hover:border-slate-300';
  let valueColor = 'text-slate-900';

  if (variant === 'success') {
    borderHover = 'border-emerald-200/80 hover:border-emerald-300';
    valueColor = 'text-emerald-700';
  } else if (variant === 'warning') {
    borderHover = 'border-amber-200/80 hover:border-amber-300';
    valueColor = 'text-amber-800';
  } else if (variant === 'danger') {
    borderHover = 'border-red-200/80 hover:border-red-300';
    valueColor = 'text-red-700';
  } else if (variant === 'info') {
    borderHover = 'border-blue-200/80 hover:border-blue-300';
    valueColor = 'text-blue-700';
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${borderHover} ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </p>
          <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${valueColor}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-600 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
};
