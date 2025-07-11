import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Bot, User, Send, Sparkles, RefreshCw } from 'lucide-react';
import { useAuthContext } from '../hooks/AuthContext';
import { supabase, type ChatMessage } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';

const QUICK_ACTIONS = [
  "What are our top selling products?",
  "Show me recent transactions",
  "What products are out of stock?",
  "What is our total sales this month?",
  "List all companies from USA",
  "What products need restocking?"
];

export const ChatPage: React.FC = () => {
  const { admin } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle message sending
  const handleSendMessage = async (messageText?: string) => {
    const query = (messageText || inputValue).trim();
    if (!query || isLoading || !admin) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      session_id: 'local_session',
      role: 'user',
      content: query,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: query,
          conversationId: 'session_' + Date.now(),
          history: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }))
        },
      });

      if (error) throw new Error(error.message);

      // Extract response details
      const responseContent = data?.content || data?.response || "Sorry, I couldn't generate a response.";
      const responseType = data?.type || 'unknown';
      const functionUsed = data?.functionUsed;
      const confidence = data?.confidence;

      // Add simple type indicator to content for better UX
      let displayContent = responseContent;
      if (responseType === 'data' && functionUsed) {
        displayContent = `� ${responseContent}`;
      } else if (responseType === 'conversational') {
        displayContent = `💬 ${responseContent}`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        session_id: 'local_session',
        role: 'assistant',
        content: displayContent,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        session_id: 'local_session',
        role: 'assistant',
        content: "❌ I'm sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render message content simply
  const renderMessageContent = (message: ChatMessage) => {
    return <ReactMarkdown className="prose max-w-none">{message.content}</ReactMarkdown>;
  };

  // Handle enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Bot className="h-6 w-6 text-quickcart-600 mr-3" />
            Stella - AI Business Assistant
          </h1>
          <p className="text-gray-600 mt-1">
            Your personal AI assistant. Start a conversation below.
          </p>
        </div>

        <Card className="flex-1 flex flex-col rounded-none border-none">
          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 max-w-3xl ${message.role === 'user' ? 'justify-end ml-auto' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  )}
                  
                  <div className={`p-4 rounded-lg max-w-full ${message.role === 'user' ? 'bg-quickcart-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {renderMessageContent(message)}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-quickcart-600 text-white">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3 max-w-3xl justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="p-4 rounded-lg bg-gray-100 text-gray-900">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {messages.length === 0 && !isLoading && (
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-sm font-medium">Try asking:</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(q => (
                    <Button 
                      key={q} 
                      size="sm" 
                      variant="outline" 
                      className="text-left whitespace-normal h-auto py-2"
                      onClick={() => handleSendMessage(q)}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center space-x-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Stella anything..."
                  disabled={isLoading}
                  className="flex-1"
                  label=""
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-24"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Send</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};