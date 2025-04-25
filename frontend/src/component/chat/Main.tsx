"use client";
import { ArrowUp, RefreshCw, Plus, Loader2, X, Pause, Square } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Message,MainProps } from "@/types/chat";



const getRandomDelay = () => Math.floor(Math.random() * 2000) + 1000;

export default function Main({ name,isOpen,setIsOpen ,onSendMessage }: MainProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello",
      type: "user",
      timestamp: new Date(),
    },
    {
      id: 2,
      text: "Hi",
      type: "bot",
      timestamp: new Date(),
    },
    {
      id: 3,
      text: "How are you?",
      type: "user",
      timestamp: new Date(),
    },
    {
      id: 4,
      text: "I am fine",
      type: "bot",
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const fetchBotResponse = async (userMessage: string): Promise<string> => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, getRandomDelay());

        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("Request aborted"));
        });
      });

      const responses = [
        `I understand you said: "${userMessage}". How can I help?`,
        `Thanks for your message about "${userMessage}". Can you provide more details?`,
        `I've processed your inquiry about "${userMessage}". Let me know if you need anything else.`,
      ];

      return responses[Math.floor(Math.random() * responses.length)];
    } catch (error) {
      if ((error as Error).message === "Request aborted") {
        console.log("API request was cancelled");
      }
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    const newUserMessage: Message = {
      id: messages.length + 1,
      text: userMessage,
      type: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);

    if (onSendMessage) {
      onSendMessage(userMessage);
    }

    setInputText("");
    textareaRef.current?.focus();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    try {
      const botResponse = await fetchBotResponse(userMessage);

      const newBotMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        type: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      if ((error as Error).message !== "Request aborted") {
        const errorMessage: Message = {
          id: messages.length + 2,
          text: "Sorry, I couldn't process your request. Please try again.",
          type: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }
  return (
    <div className="flex flex-col min-w-[38vh] h-full max-h-screen px-4 transition-all duration-300  bg-gray-50 border-2 border-gray-100  max-w-full">
      <div className="flex flex-row items-center justify-between w-full py-4 ">
        <h2 className="font-semibold text-lg truncate">{name || "Chat"}</h2>
        <span className="flex flex-row gap-2">
          <button
            aria-label="Refresh conversation"
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="text-gray-500" size={19} />
          </button>
          <button
            aria-label="New chat"
            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
            onClick={handleNewChat}
          >
            <Plus className="text-gray-500 rotate-45" size={24} />
          </button>
        </span>
      </div>

      <div className="w-full h-full overflow-y-auto py-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Start a new conversation
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === "user" ? "justify-end w-full" : "justify-start"
              } mb-3`}
            >
              <div
                className={`${
                  msg.type === "user"
                    ? "bg-blue-500 text-white rounded-t-2xl rounded-l-2xl p-2"
                    : "bg-gray-200 rounded-t-2xl rounded-r-2xl p-2"
                } max-w-[85%] break-words shadow-sm`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-200 rounded-t-2xl rounded-r-2xl p-3 flex items-center">
              <Loader2 className="animate-spin mr-2" size={16} />
              <span className="text-sm text-gray-600">AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col border border-blue-200 bg-white w-full rounded-2xl my-4 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-400 transition-all">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="w-full py-3 px-4 rounded-t-2xl focus:outline-none bg-transparent resize-none min-h-[45px] max-h-[120px]"
          aria-label="Message input"
          disabled={isLoading}
          rows={1}
        />

        <div className="flex justify-between items-center px-2 py-1.5 border-t border-gray-100">
          <span className="text-xs text-gray-400 pl-2">
            Press Enter to send, Shift+Enter for new line
          </span>
          <div>
            {isLoading ? (
              <button
                onClick={handleCancelRequest}
                className="p-2 rounded-full transition-all bg-gray-400 hover:bg-gray-600 mr-1"
                aria-label="Cancel request"
              >
                <Square color="white" size={18} />
              </button>
            ) : (
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isLoading}
                className={`p-2 rounded-full transition-all ${
                  inputText.trim() && !isLoading
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <ArrowUp color="white" size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
