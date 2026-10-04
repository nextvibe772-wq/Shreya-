import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Square,
  Copy,
  Volume2,
  Sparkles,
  Paperclip,
  Check,
  Plus,
  Trash2,
  Table,
  Zap,
} from 'lucide-react';
import { ChatMessage, Conversation, AssistantVoiceState } from '../../types';
import { AppDatabase } from '../../services/storage/database';
import { shreyaCore } from '../../services/core/ShreyaCore';
import { speechRecognizer } from '../../services/voice/SpeechRecognizer';
import { ttsManager } from '../../services/voice/TTSManager';
import { VoiceOrb } from '../ui/VoiceOrb';

interface ChatViewProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  voiceState: AssistantVoiceState;
  setVoiceState: (state: AssistantVoiceState) => void;
  hasSheetsAuth: boolean;
  onOpenSheets: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  voiceState,
  setVoiceState,
  hasSheetsAuth,
  onOpenSheets,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setMessages(AppDatabase.getMessages(activeConversation.id));
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || !activeConversation) return;

    setInputValue('');
    setLiveTranscript('');
    setVoiceState('processing');

    try {
      await shreyaCore.processInput(text, activeConversation.id, {
        onStateChange: (state) => setVoiceState(state),
        onPartialResponse: (chunk) => {
          // Stream updates into message list
          setMessages(AppDatabase.getMessages(activeConversation.id));
        },
        onMessageGenerated: (msg) => {
          setMessages(AppDatabase.getMessages(activeConversation.id));
        },
      });
    } catch (e) {
      console.error('Error processing message:', e);
      setVoiceState('error');
    }
  };

  const toggleMicListening = () => {
    if (voiceState === 'listening') {
      speechRecognizer.stop();
      setVoiceState('idle');
      if (liveTranscript.trim()) {
        handleSendMessage(liveTranscript);
      }
      return;
    }

    if (voiceState === 'speaking') {
      // Barge-in: interrupt speech immediately
      ttsManager.stop();
      setVoiceState('idle');
      return;
    }

    // Start listening
    setLiveTranscript('');
    setVoiceState('listening');

    speechRecognizer.start({
      onStart: () => setVoiceState('listening'),
      onResult: (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          speechRecognizer.stop();
          setVoiceState('processing');
          handleSendMessage(transcript);
        }
      },
      onError: (err) => {
        console.warn('STT error:', err);
        setVoiceState('idle');
      },
      onEnd: () => {
        setVoiceState('idle');
      },
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakMessage = (text: string) => {
    const settings = AppDatabase.getSettings();
    setVoiceState('speaking');
    ttsManager.speak(text, {
      speed: settings.voiceSpeed,
      pitch: settings.voicePitch,
      language: settings.language,
      voiceName: settings.voiceName,
      onEnd: () => setVoiceState('idle'),
      onError: () => setVoiceState('idle'),
    });
  };

  const quickPrompts = [
    { text: 'Create a new Google Sheet for my tasks', icon: Table, action: () => handleSendMessage('Create a new Google Sheet for my tasks') },
    { text: 'Log this activity to my active Google Sheet', icon: Table, action: () => handleSendMessage('Log this activity to my active Google Sheet') },
    { text: 'What can you do with ESP32 and PC?', icon: Zap, action: () => handleSendMessage('What can you do with ESP32 and PC?') },
    { text: 'Search latest AI news and summarize', icon: Sparkles, action: () => handleSendMessage('Search latest AI news and summarize') },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-950">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 space-y-6">
            <VoiceOrb state={voiceState} size="xl" onClick={toggleMicListening} />

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-neutral-100">
                Namaste! I am <span className="text-cyan-400">SHREYA</span>
              </h2>
              <p className="text-sm text-neutral-400 max-w-md">
                Your personal AI voice assistant with multi-engine intelligence, Google Sheets logging, and smart hardware control.
              </p>
            </div>

            {/* Quick Action Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-2">
              {quickPrompts.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <button
                    key={idx}
                    onClick={q.action}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-neutral-800 text-left text-xs text-neutral-300 hover:text-white transition-all cursor-pointer group"
                  >
                    <Icon className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate">{q.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm shadow-lg shadow-cyan-950/20'
                        : 'bg-neutral-900 border border-neutral-800/80 text-neutral-200 rounded-tl-sm shadow-xl'
                    }`}
                  >
                    {/* Assistant Skill Execution Badge */}
                    {!isUser && msg.skillExecuted && (
                      <div className="mb-2.5 pb-2 border-b border-neutral-800 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Skill: {msg.skillExecuted.summary}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Message Actions */}
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
                        <div className="flex items-center gap-2">
                          <span className="capitalize font-mono text-[10px] text-neutral-500">
                            {msg.provider || 'Shreya Core'} {msg.model ? `(${msg.model})` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => speakMessage(msg.content)}
                            className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition-colors"
                            title="Speak message aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-cyan-300 transition-colors"
                            title="Copy text"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-500 px-2 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Live Streaming Speech Preview */}
            {liveTranscript && (
              <div className="flex flex-col items-end space-y-1">
                <div className="max-w-[85%] rounded-3xl p-3.5 bg-cyan-950/60 border border-cyan-800/50 text-cyan-200 text-sm italic animate-pulse">
                  {liveTranscript}
                </div>
                <span className="text-[10px] text-cyan-500 font-mono">Listening live...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Floating Mini Orb if messages are present */}
      {messages.length > 0 && (
        <div className="fixed bottom-24 right-6 z-20 hidden md:block">
          <VoiceOrb state={voiceState} size="sm" onClick={toggleMicListening} />
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 md:p-4 bg-neutral-950/90 border-t border-neutral-800/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-1.5 focus-within:border-cyan-500/80 transition-colors shadow-2xl"
          >
            {/* Voice Button */}
            <button
              type="button"
              onClick={toggleMicListening}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                voiceState === 'listening'
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/40'
                  : voiceState === 'speaking'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                  : 'bg-neutral-800 text-cyan-400 hover:bg-neutral-700 hover:text-cyan-300'
              }`}
              title={
                voiceState === 'listening'
                  ? 'Tap to stop listening'
                  : voiceState === 'speaking'
                  ? 'Tap to interrupt speech (Barge-in)'
                  : 'Tap to speak'
              }
            >
              {voiceState === 'speaking' ? (
                <Square className="w-5 h-5 fill-current" />
              ) : voiceState === 'listening' ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                voiceState === 'listening'
                  ? 'Listening to your voice...'
                  : 'Talk to SHREYA or type a command (Hindi / English / Hinglish)...'
              }
              className="flex-1 bg-transparent px-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />

            {/* Google Sheets Quick Link Button */}
            <button
              type="button"
              onClick={onOpenSheets}
              className="p-2 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer hidden sm:block"
              title="Google Sheets Studio"
            >
              <Table className="w-5 h-5" />
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-all disabled:opacity-30 disabled:hover:bg-cyan-600 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
