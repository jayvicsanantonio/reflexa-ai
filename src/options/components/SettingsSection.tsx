import React from 'react';

export interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <section className="border-calm-200 shadow-soft rounded-lg border bg-white p-6">
      <div className="mb-4">
        <h2 className="text-calm-900 text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-calm-600 mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  );
};
