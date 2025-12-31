
"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, X, Loader2, Sparkles, User, Bot, MessageSquare, Plus, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
    role: "user" | "model";
    content: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

interface GeminiChatProps {
    onClose: () => void;
}

export function GeminiChat({ onClose }: GeminiChatProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load sessions from API on mount
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await fetch("/api/chats");
                if (response.ok) {
                    const data = await response.json();
                    setSessions(data);
                }
            } catch (error) {
                console.error("Failed to load chats:", error);
            }
        };
        fetchChats();
    }, []);

    // Save session to API
    const persistSession = async (session: ChatSession) => {
        try {
            await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(session)
            });
        } catch (error) {
            console.error("Failed to save chat:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const createNewChat = () => {
        setMessages([]);
        setCurrentSessionId(null);
        setInput("");
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const loadSession = (session: ChatSession) => {
        const msgs = session.messages as Message[]; // Type assertion for JSONB
        setMessages(msgs);
        setCurrentSessionId(session.id);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const saveCurrentSession = async (newMessages: Message[], firstMessageContent: string) => {
        const now = Date.now();
        let sessionToSave: ChatSession;

        if (currentSessionId) {
            // Update existing session
            sessionToSave = {
                id: currentSessionId,
                title: sessions.find(s => s.id === currentSessionId)?.title || firstMessageContent.slice(0, 30),
                messages: newMessages,
                timestamp: now
            };

            setSessions(prev => prev.map(s =>
                s.id === currentSessionId ? sessionToSave : s
            ).sort((a, b) => b.timestamp - a.timestamp));
        } else {
            // Create new session
            const newId = crypto.randomUUID();
            sessionToSave = {
                id: newId,
                title: firstMessageContent.slice(0, 30) + (firstMessageContent.length > 30 ? "..." : ""),
                messages: newMessages,
                timestamp: now
            };
            setSessions(prev => [sessionToSave, ...prev]);
            setCurrentSessionId(newId);
        }

        // Persist to DB
        await persistSession(sessionToSave);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userContent = input.trim();
        const userMessage: Message = { role: "user", content: userContent };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        const sessionToSave = messages.length === 0 ? userContent : (sessions.find(s => s.id === currentSessionId)?.title || userContent);
        // Optimistically save/create session with user message
        saveCurrentSession(updatedMessages, sessionToSave);

        try {
            const response = await fetch("/api/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: updatedMessages,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch response");
            }

            if (!response.body) return;

            // Initialize bot message
            const botMessage: Message = { role: "model", content: "" };
            setMessages(prev => [...prev, botMessage]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // Update specific message in state
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.role === "model") {
                        lastMsg.content = fullText;
                    }
                    return newMessages;
                });
            }

            // Final save with complete bot message
            const finalMessages = [...updatedMessages, { role: "model", content: fullText } as Message];
            saveCurrentSession(finalMessages, sessionToSave);

        } catch (error) {
            console.error("Error:", error);
            const errorMessage: Message = {
                role: "model",
                content: "Error: Could not connect to Gemini."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[1200px] h-[85vh] bg-[#0f0f10] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex relative animate-in zoom-in-95 duration-200">

                {/* Sidebar */}
                <div className={cn(
                    "absolute md:relative z-20 h-full bg-[#0f0f10] md:bg-[#0a0a0a] border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col",
                    isSidebarOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full md:w-0 md:-translate-x-0 overflow-hidden"
                )}>
                    <div className="p-4 flex flex-col gap-2 h-full min-w-64">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-sm font-medium text-zinc-400">History</h3>
                            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-zinc-500">
                                <X size={20} />
                            </button>
                        </div>

                        <button
                            onClick={createNewChat}
                            className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1c] hover:bg-[#252528] text-white rounded-xl transition-colors mb-4 border border-white/5"
                        >
                            <Plus size={18} />
                            <span className="text-sm font-medium">New Chat</span>
                        </button>

                        <div className="flex-1 overflow-y-auto space-y-1">
                            {sessions.map(session => (
                                <button
                                    key={session.id}
                                    onClick={() => loadSession(session)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors group",
                                        currentSessionId === session.id
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <MessageSquare size={16} className={cn(
                                        "flex-shrink-0",
                                        currentSessionId === session.id ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400"
                                    )} />
                                    <span className="truncate" dir="auto">{session.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col h-full relative min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#0f0f10] border-b border-white/5 z-10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 -ml-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Menu size={20} />
                            </button>
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                <Sparkles size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Gemini 2.5 Pro</h2>
                                <p className="text-xs text-zinc-400">Advanced AI Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 gap-6 flex flex-col scroll-smooth">
                        {messages.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 select-none">
                                <Sparkles size={48} className="text-zinc-600 mb-4" />
                                <h3 className="text-xl font-medium text-zinc-300">How can I help you today?</h3>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex gap-4 max-w-[90%]",
                                    message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                )}
                            >
                                <div className={cn(
                                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                    message.role === "user" ? "bg-orange-500" : "bg-gradient-to-br from-blue-500 to-purple-600"
                                )}>
                                    {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                <div className={cn(
                                    "p-4 rounded-2xl text-sm leading-relaxed",
                                    message.role === "user"
                                        ? "bg-zinc-800 text-white rounded-tr-sm"
                                        : "bg-[#1a1a1c] text-zinc-100 rounded-tl-sm border border-white/5"
                                )}>
                                    {/* Added dir="rtl" to container for overall text alignment if mixed, 
                                        but specifically using tailwind for text alignment */}
                                    <div className="prose prose-invert prose-sm max-w-none text-right" dir="auto">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4 mr-auto max-w-[90%]">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Bot size={16} />
                                </div>
                                <div className="bg-[#1a1a1c] border border-white/5 p-4 rounded-2xl rounded-tl-sm flex items-center">
                                    <Loader2 size={20} className="animate-spin text-zinc-400" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-[#0f0f10] border-t border-white/5">
                        <form onSubmit={handleSubmit} className="relative flex items-end max-w-4xl mx-auto">
                            <textarea
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                                placeholder="Ask anything..."
                                rows={1}
                                dir="auto"
                                className="w-full bg-[#1a1a1c] text-white placeholder-zinc-500 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 border border-white/5 transition-all resize-none min-h-[56px] max-h-[200px] text-right"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute left-2 bottom-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-zinc-600">Gemini may display inaccurate info, including about people, so double-check its responses.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
