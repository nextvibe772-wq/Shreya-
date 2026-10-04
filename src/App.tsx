import React, { useState, useEffect } from 'react';
import { AppDatabase } from './services/storage/database';
import { subscribeToAuth } from './services/auth/firebaseAuth';
import { backgroundService, BackgroundServiceState } from './services/core/BackgroundService';
import { Conversation, AssistantVoiceState } from './types';
import { Header } from './components/ui/Header';
import { NavigationDrawer, AppTab } from './components/ui/NavigationDrawer';
import { ChatView } from './components/chat/ChatView';
import { GoogleSheetsView } from './components/sheets/GoogleSheetsView';
import { TasksView } from './components/tasks/TasksView';
import { DevicesView } from './components/devices/DevicesView';
import { MemoryView } from './components/memory/MemoryView';
import { ApiSettingsView } from './components/providers/ApiSettingsView';
import { PermissionManager } from './components/permissions/PermissionManager';
import { DeveloperConsole } from './components/developer/DeveloperConsole';
import { SettingsView } from './components/settings/SettingsView';
import { PWAInstallModal } from './components/ui/PWAInstallModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [voiceState, setVoiceState] = useState<AssistantVoiceState>('idle');
  const [bgState, setBgState] = useState<BackgroundServiceState>(backgroundService.getState());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sheetsToken, setSheetsToken] = useState<string | null>(null);
  const [settings, setSettings] = useState(() => AppDatabase.getSettings());

  // Initialization lifecycle
  useEffect(() => {
    AppDatabase.initialize();

    // Load conversations
    let convs = AppDatabase.getConversations();
    if (convs.length === 0) {
      const defaultConv = AppDatabase.createConversation('General Voice Assistant');
      convs = [defaultConv];
    }
    setConversations(convs);
    setActiveConversation(convs[0]);

    // Subscribe to Google Firebase Auth & Google Sheets token
    const unsubscribeAuth = subscribeToAuth((user, token) => {
      setCurrentUser(user);
      setSheetsToken(token);
    });

    // Subscribe to Background Service state
    const unsubscribeBg = backgroundService.subscribe((state) => {
      setBgState(state);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBg();
    };
  }, []);

  const handleNewConversation = () => {
    const newConv = AppDatabase.createConversation(`Chat ${conversations.length + 1}`);
    setConversations(AppDatabase.getConversations());
    setActiveConversation(newConv);
    setActiveTab('chat');
  };

  const handleDeleteConversation = (id: string) => {
    AppDatabase.deleteConversation(id);
    const updated = AppDatabase.getConversations();
    setConversations(updated);
    if (activeConversation?.id === id) {
      setActiveConversation(updated[0] || null);
    }
  };

  const handleRefreshSettings = () => {
    setSettings(AppDatabase.getSettings());
  };

  return (
    <div className="flex h-screen w-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden select-none">
      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onClose={() => setIsDrawerOpen(false)}
        hasSheetsAuth={Boolean(sheetsToken)}
        conversationCount={conversations.length}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Persistent Top Header */}
        <Header
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          primaryProvider={settings.primaryProvider}
          currentModel={
            AppDatabase.getProviders().find((p) => p.id === settings.primaryProvider)?.model ||
            'llama-3.3-70b-versatile'
          }
          bgState={bgState}
          hasSheetsAuth={Boolean(sheetsToken)}
          activeSheetTitle={settings.activeSpreadsheetTitle}
          isListening={voiceState === 'listening'}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />

        {/* Tab Content Router */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeTab === 'chat' && (
            <ChatView
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={(conv) => setActiveConversation(conv)}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              voiceState={voiceState}
              setVoiceState={setVoiceState}
              hasSheetsAuth={Boolean(sheetsToken)}
              onOpenSheets={() => setActiveTab('sheets')}
            />
          )}

          {activeTab === 'sheets' && (
            <GoogleSheetsView
              user={currentUser}
              token={sheetsToken}
              onRefreshAuth={() => {
                handleRefreshSettings();
              }}
            />
          )}

          {activeTab === 'tasks' && <TasksView />}

          {activeTab === 'devices' && <DevicesView />}

          {activeTab === 'memory' && <MemoryView />}

          {activeTab === 'providers' && (
            <ApiSettingsView onProviderUpdated={handleRefreshSettings} />
          )}

          {activeTab === 'permissions' && (
            <PermissionManager onOpenSheets={() => setActiveTab('sheets')} />
          )}

          {activeTab === 'developer' && <DeveloperConsole />}

          {activeTab === 'settings' && (
            <SettingsView
              bgState={bgState}
              onSettingsChanged={handleRefreshSettings}
            />
          )}
        </main>

        {/* In-App PWA / APK Install Modal */}
        <PWAInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </div>
    </div>
  );
}
