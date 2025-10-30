import React from 'react';
import SignInModal from './components/SignInModal';

function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="app">
      <header>
        <h1>NovaHunt</h1>
        <button onClick={() => setModalOpen(true)}>Sign In</button>
      </header>
      <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

export default App;
