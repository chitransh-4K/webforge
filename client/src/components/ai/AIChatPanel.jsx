import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore.js';
import { useAIStore } from '../../stores/useAIStore.js';
import { useUIStore } from '../../stores/useUIStore.js';
import { ProposalCard } from './ProposalCard.jsx';
import {
  Bot,
  Send,
  Trash2,
  X,
  Lock,
  User,
  AlertTriangle,
  Sparkles,
  CheckCheck,
  Ban,
} from 'lucide-react';

export function AIChatPanel() {
  const { user } = useAuthStore();
  const {
    messages,
    sendMessage,
    isStreaming,
    clearChat,
    acceptAll,
    rejectAll,
    checkStaleProposals,
  } = useAIStore();
  const { toggleChat, openModal } = useUIStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const chatScrollRef = useRef(null);

  // Auto-scroll on new message or tokens
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Check for stale proposals whenever editor state changes
  useEffect(() => {
    checkStaleProposals();
  }, [checkStaleProposals]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isStreaming) return;
    const promptToSend = inputPrompt;
    setInputPrompt('');
    sendMessage(promptToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Locked state for Guests
  if (!user) {
    return (
      <div className="flex flex-col h-full w-full bg-[#1e1e1e] border-l border-vscode-dark-border select-none">
        <div className="flex items-center justify-between px-3 h-9 bg-vscode-dark-sidebar border-b border-vscode-dark-border text-xs">
          <div className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px]">
            <Bot className="w-4 h-4 text-sky-400" />
            <span className="font-semibold uppercase tracking-wider">AI Assistant</span>
          </div>
          <button
            onClick={toggleChat}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Assistant Locked</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-xs">
              WebForge AI can review, explain, and propose edits to your project code. Sign in or create a free account to unlock AI capabilities.
            </p>
          </div>
          <button
            onClick={() => openModal('auth')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#007acc] hover:bg-[#0098ff] text-white text-xs font-medium transition shadow-md"
          >
            <User className="w-4 h-4" />
            <span>Sign In to Unlock AI</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] border-l border-vscode-dark-border font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 bg-vscode-dark-sidebar border-b border-vscode-dark-border text-xs shrink-0">
        <div className="flex items-center gap-1.5 text-gray-300 font-mono text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-semibold uppercase tracking-wider">AI Assistant</span>
          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-sans">
            OpenRouter
          </span>
        </div>

        <div className="flex items-center gap-1 text-gray-400">
          <button
            onClick={clearChat}
            title="Clear Chat History"
            className="p-1 rounded hover:text-white hover:bg-white/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleChat}
            title="Close AI Chat"
            className="p-1 rounded hover:text-white hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-4 select-text">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 text-xs p-6 space-y-2 select-none">
            <Bot className="w-8 h-8 text-sky-400/50 mb-1" />
            <p className="font-medium text-gray-300">How can I help with your code?</p>
            <p className="text-[11px] max-w-xs text-gray-500 leading-normal">
              Ask questions about your project, request new features, or ask for code explanations.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const hasPending = msg.proposals?.some((p) => p.status === 'pending');

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-[#007acc] text-white shadow-sm'
                    : 'bg-[#252526] text-gray-200 border border-vscode-dark-border shadow-md'
                }`}
              >
                {/* Text Content */}
                <div className="whitespace-pre-wrap font-sans break-words">
                  {msg.content}
                </div>

                {/* Truncated Files Warning */}
                {msg.truncatedFiles && msg.truncatedFiles.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Token budget reached: {msg.truncatedFiles.length} file(s) omitted from AI context.
                    </span>
                  </div>
                )}

                {/* Proposals and Batch Action Bar */}
                {msg.proposals && msg.proposals.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-300">
                        Proposed Changes ({msg.proposals.length})
                      </span>
                      {hasPending && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => rejectAll(msg.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-gray-300 hover:text-white transition"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Reject All</span>
                          </button>
                          <button
                            onClick={() => acceptAll(msg.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-medium transition"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>Accept All</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      {msg.proposals.map((prop) => (
                        <ProposalCard key={prop.id} proposal={prop} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex items-center gap-2 text-sky-400 text-xs font-mono py-1">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>WebForge AI is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-vscode-dark-border bg-[#252526] shrink-0">
        <div className="flex items-end gap-2 bg-[#1e1e1e] border border-vscode-dark-border focus-within:border-[#007acc] rounded-lg p-2 transition">
          <textarea
            rows={2}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this project... (Enter to send, Shift+Enter for newline)"
            style={{ fontSize: '16px' }}
            className="flex-1 bg-transparent text-xs text-white outline-none resize-none placeholder-gray-500 font-sans leading-relaxed"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isStreaming}
            className="p-1.5 rounded-md bg-[#007acc] hover:bg-[#0098ff] disabled:opacity-30 disabled:pointer-events-none text-white transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
