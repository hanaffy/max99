import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Lobby from './pages/Lobby';
import ChatRoom from './pages/ChatRoom';
import DirectMessage from './pages/DirectMessage';
import Profile from './pages/Profile';
import { AppView } from './types';

const Main: React.FC = () => {
  const { currentView } = useApp();

  // Route Rendering
  const renderView = () => {
    switch (currentView) {
      case AppView.AUTH:
        return <Auth />;
      case AppView.LOBBY:
        return (
          <>
            <Navbar />
            <Lobby />
          </>
        );
      case AppView.CHAT:
        return (
          <>
            <Navbar />
            <ChatRoom />
          </>
        );
      case AppView.DM:
        return (
          <>
            <Navbar />
            <DirectMessage />
          </>
        );
      case AppView.PROFILE:
        return (
          <>
            <Navbar />
            <Profile />
          </>
        );
      default:
        return <Auth />;
    }
  };

  return <div className="min-h-screen bg-gray-100 font-sans">{renderView()}</div>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
};

export default App;