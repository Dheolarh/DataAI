import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Bot, User, Send, Sparkles, RefreshCw, Search, ChevronDown, X } from 'lucide-react';
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

interface DatabaseEntity {
  id: string;
  name: string;
  category?: string;
  type: 'product' | 'company' | 'category' | 'admin' | 'transaction';
  description?: string;
}

interface MentionSuggestion {
  type: 'product' | 'company' | 'category' | 'admin';
  position: number;
  query: string;
}

export const ChatPage: React.FC = () => {
  const { admin } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionSuggestion, setMentionSuggestion] = useState<MentionSuggestion | null>(null);
  const [entities, setEntities] = useState<DatabaseEntity[]>([]);
  const [filteredEntities, setFilteredEntities] = useState<DatabaseEntity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load entities when component mounts
  useEffect(() => {
    loadEntities();
  }, []);

  // Load database entities for mentions
  const loadEntities = async () => {
    try {
      const [products, companies, categories, admins] = await Promise.all([
        supabase.from('products').select('id, name, sku').limit(100),
        supabase.from('companies').select('id, name, country').limit(100),
        supabase.from('categories').select('id, name, description').limit(100),
        supabase.from('admins').select('id, name, email, role').limit(100)
      ]);

      const allEntities: DatabaseEntity[] = [
        ...(products.data || []).map(p => ({
          id: p.id,
          name: p.name,
          type: 'product' as const,
          description: p.sku
        })),
        ...(companies.data || []).map(c => ({
          id: c.id,
          name: c.name,
          type: 'company' as const,
          description: c.country
        })),
        ...(categories.data || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          type: 'category' as const,
          description: cat.description
        })),
        ...(admins.data || []).map(a => ({
          id: a.id,
          name: a.name,
          type: 'admin' as const,
          description: `${a.role} - ${a.email}`
        }))
      ];

      setEntities(allEntities);
    } catch (error) {
      console.error('Failed to load entities:', error);
    }
  };

  // Handle input change and detect @ mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for @ mentions
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const afterAt = value.substring(atIndex + 1);
      
      if (afterAt === '') {
        // Just typed @, show mention types
        setMentionSuggestion({
          type: 'product',
          position: atIndex,
          query: ''
        });
        setShowMentionPopup(true);
        setSearchQuery('');
        setFilteredEntities([]);
      } else {
        const parts = afterAt.split(':');
        
        if (parts.length === 1) {
          // Still typing the type (e.g., @prod)
          const types = ['product', 'company', 'category', 'admin'];
          const matchingType = types.find(t => t.startsWith(parts[0].toLowerCase()));
          
          if (matchingType) {
            setMentionSuggestion({
              type: matchingType as any,
              position: atIndex,
              query: parts[0]
            });
            setShowMentionPopup(true);
            
            // If it's a complete type like "product", show all entities of that type
            if (matchingType === parts[0].toLowerCase()) {
              const filtered = entities
                .filter(entity => entity.type === matchingType)
                .slice(0, 10);
              setFilteredEntities(filtered);
            } else {
              setFilteredEntities([]);
            }
          }
        } else if (parts.length >= 2 && parts[0]) {
          // Typing entity name (e.g., @product: or @product:iPhone)
          const type = parts[0].toLowerCase();
          const query = parts.slice(1).join(':'); // Handle cases with : in product names
          
          if (['product', 'company', 'category', 'admin'].includes(type)) {
            setMentionSuggestion({
              type: type as any,
              position: atIndex,
              query: query
            });
            setSearchQuery(query);
            
            // Filter entities by type and search query
            const filtered = entities
              .filter(entity => entity.type === type)
              .filter(entity => {
                if (query.trim() === '') return true; // Show all if no query
                return entity.name.toLowerCase().includes(query.toLowerCase()) ||
                       entity.description?.toLowerCase().includes(query.toLowerCase());
              })
              .slice(0, 10);
            
            setFilteredEntities(filtered);
            setShowMentionPopup(true);
          }
        }
      }
    } else {
      setShowMentionPopup(false);
      setMentionSuggestion(null);
    }
  };

  // Select entity from mention popup
  const selectEntity = (entity: DatabaseEntity) => {
    if (!mentionSuggestion) return;

    const beforeMention = inputValue.substring(0, mentionSuggestion.position);
    const replacement = `@${entity.type}:${entity.name}`;
    
    setInputValue(beforeMention + replacement + ' ');
    setShowMentionPopup(false);
    setMentionSuggestion(null);
    inputRef.current?.focus();
  };

  // Select mention type
  const selectMentionType = (type: string) => {
    if (!mentionSuggestion) return;

    const beforeMention = inputValue.substring(0, mentionSuggestion.position);
    const replacement = `@${type}:`;
    
    setInputValue(beforeMention + replacement);
    setMentionSuggestion({
      type: type as any,
      position: mentionSuggestion.position,
      query: ''
    });
    setSearchQuery('');
    
    // Show entities of this type
    const filtered = entities
      .filter(entity => entity.type === type)
      .slice(0, 10);
    
    setFilteredEntities(filtered);
    inputRef.current?.focus();
  };

  // Extract mentions from text
  const extractMentions = (text: string) => {
    const mentionRegex = /@(product|company|category|admin):([^@\s]+)/g;
    const mentions: Array<{type: string, name: string, id?: string}> = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const type = match[1];
      const name = match[2];
      
      // Find the actual entity to get its ID
      const entity = entities.find(e => 
        e.type === type && e.name.toLowerCase() === name.toLowerCase()
      );

      mentions.push({
        type,
        name,
        id: entity?.id
      });
    }

    return mentions;
  };

  // Handle message sending
  const handleSendMessage = async (messageText?: string) => {
    const query = (messageText || inputValue).trim();
    if (!query || isLoading || !admin) return;

    // Close mention popup if open
    setShowMentionPopup(false);
    setMentionSuggestion(null);

    // Extract mentions from the query
    const mentions = extractMentions(query);

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
          mentions: mentions, // Send extracted mentions to AI
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
              <div className="flex items-center space-x-3 relative">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Stella anything... (Use @ to mention specific entities)"
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-quickcart-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  
                  {/* Mention Popup */}
                  {showMentionPopup && (
                    <div className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                      {!mentionSuggestion?.type ? (
                        // Show entity types when just @ is typed
                        <div className="p-2">
                          <div className="text-xs text-gray-500 mb-2">Select entity type:</div>
                          {['product', 'company', 'category', 'admin'].map((type) => (
                            <button
                              key={type}
                              onClick={() => selectMentionType(type)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm flex items-center gap-2"
                            >
                              <span className="capitalize">{type}</span>
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        // Show filtered entities for the selected type
                        <div className="p-2">
                          <div className="text-xs text-gray-500 mb-2">
                            Select {mentionSuggestion.type}:
                          </div>
                          
                          {filteredEntities.length > 0 ? (
                            filteredEntities.map((entity) => (
                              <button
                                key={entity.id}
                                onClick={() => selectEntity(entity)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium">{entity.name}</div>
                                {entity.description && (
                                  <div className="text-xs text-gray-500 truncate">
                                    {entity.description}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : mentionSuggestion.type && entities.filter(e => e.type === mentionSuggestion.type).length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No {mentionSuggestion.type}s found in database
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {mentionSuggestion.query ? `No ${mentionSuggestion.type}s match "${mentionSuggestion.query}"` : 'Loading...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-24"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Send</>}
                </Button>
              </div>
              
              {/* Help text */}
              <div className="mt-2 text-xs text-gray-500">
                💡 Tip: Use @ to mention specific entities (e.g., @product:iPhone, @company:Apple)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};