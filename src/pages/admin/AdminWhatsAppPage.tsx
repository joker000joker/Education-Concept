import React from 'react';
import { DynamicTableManager } from '../../components/admin/DynamicTableManager';

export const AdminWhatsAppPage = () => {
  return (
    <DynamicTableManager 
      tableName="app_settings" 
      title="WhatsApp & Public Settings" 
      primaryKey="key"
      fields={[
        { name: 'key', label: 'Setting Key (e.g. whatsapp_number)', type: 'text', required: true },
        { name: 'value', label: 'Setting Value', type: 'text', required: true }
      ]} 
    />
  );
};
