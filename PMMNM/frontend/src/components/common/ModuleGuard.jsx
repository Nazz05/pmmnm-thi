import React from 'react';
import { useModules } from '../../context/ModuleContext';
import ModuleDisabledPage from './ModuleDisabledPage';

const ModuleGuard = ({ moduleName, children }) => {
  const { isModuleEnabled, loading } = useModules();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isModuleEnabled(moduleName)) {
    return <ModuleDisabledPage moduleName={moduleName} />;
  }

  return children;
};

export default ModuleGuard;