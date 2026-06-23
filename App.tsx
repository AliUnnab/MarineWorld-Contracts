import React from 'react';
import ContractStudio from './components/ContractStudio';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-system-bg text-system-text-primary">
      <ContractStudio onBack={() => {}} />
    </div>
  );
};

export default App;
