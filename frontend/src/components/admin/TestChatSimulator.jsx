import React, { useState } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export default function TestChatSimulator({ selectedPage }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! Welcome to our sales desk. How can I help you today with our packages and services?"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI Sales Consultant response matching the n8n prompt logic
    setTimeout(() => {
      let botReply = "Thank you for asking! We have comprehensive packages tailored to your needs. Could you tell me a bit more about your project requirements so I can recommend the exact package?";

      const lower = userMsg.toLowerCase();
      if (lower.includes('price') || lower.includes('package') || lower.includes('cost')) {
        botReply = "Our Web Development package starts from ৳15,000 / $150, and AI Integration starts from ৳25,000 / $220. Both include dedicated support and fast turnaround. Would you like to proceed with one of these?";
      } else if (lower.includes('yes') || lower.includes('order') || lower.includes('confirm') || lower.includes('proceed') || lower.includes('ঠিক আছে')) {
        botReply = "Awesome! To confirm your order, could you please provide your:\n1. Full Name\n2. Phone Number\n3. Email Address\n\nOnce received, I will present a final summary for your verification.";
      } else if (lower.includes('017') || lower.includes('018') || lower.includes('019') || lower.includes('@')) {
        botReply = "Thank you! Here is your order summary for verification:\n\n• Name: Customer\n• Selected: AI Integration Suite\n• Total: ৳25,000\n• Status: Ready for confirmation\n\nPlease reply with 'Confirm' to finalize your order!";
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
      setIsTyping(false);
    }, 900);
  };

  const handleReset = () => {
    setMessages([
      {
        sender: 'bot',
        text: "Hello! Welcome to our sales desk. How can I help you today with our packages and services?"
      }
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Chat Simulator</h2>
          <p className="text-sm text-slate-400 mt-1">
            Test how your AI Consultant interacts with customers before going live on Facebook.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Messenger Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{selectedPage?.page_name || 'AI Sales Assistant'}</p>
              <p className="text-[10px] text-emerald-400 font-medium">● Typically replies instantly</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Preview Mode</span>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[80%] whitespace-pre-line shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-500 text-xs italic pl-9">
              <span className="animate-pulse">AI Consultant is typing...</span>
            </div>
          )}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message (e.g. 'What are your prices?')..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

