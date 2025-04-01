import { useState, useRef, useEffect } from 'react';
import { Send, User, ClipboardPlus , Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from 'axios';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ClipboardPlus ';
  timestamp: Date;
}

const ChatSupport = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi there! I'm your Dr.Moo . How can I help you with your cow farming today?",
      sender: 'ClipboardPlus ',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const faqs = [
    "How often should I milk my cow?",
    "What's the best winter feed for cattle?",
    "How to tell if my cow is pregnant?",
    "Best practices for calf rearing"
  ];

  // useEffect(() => {
  //   scrollToBottom();
  // }, [messages]);

  // const scrollToBottom = () => {
  //   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // };

  const handleSend = async () => {
    if (input.trim() === '') return;
    
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Call your Flask backend's /ask endpoint
      const response = await axios.post('http://localhost:8080/ask', {
        query: input
      });

      const answer = response.data.answer.join('\n'); // Convert bullet points to new lines
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: answer,
        sender: 'ClipboardPlus ',
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Sorry, I encountered an error. Please try again later.",
        sender: 'ClipboardPlus ',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const setFaq = (question: string) => {
    setInput(question);
  };

  return (
    <section id="chat" className="py-20 bg-gradient-to-b from-white to-ghibli-blue/10">
      <div className="ghibli-container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="section-heading">Chat With Our Dr.Moo -Cow Expert</h2>
          <p className="text-ghibli-brown">
            Get real-time assistance for all your cow farming questions and concerns.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Card className="ghibli-card min-h-[500px] flex flex-col">
            <CardContent className="p-4 flex-grow flex flex-col">
              <div className="flex-grow overflow-y-auto px-2 py-4 space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user' 
                          ? 'bg-ghibli-green text-white rounded-tr-none' 
                          : 'bg-ghibli-yellow/30 text-ghibli-brown-dark rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender === 'ClipboardPlus ' ? (
                          <ClipboardPlus  className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="text-xs opacity-70">
                          {message.sender === 'user' ? 'You' : 'Dr.Moo'}
                        </span>
                      </div>
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-ghibli-yellow/30 text-ghibli-brown-dark rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ClipboardPlus  className="h-4 w-4" />
                        <span className="text-xs opacity-70">Cow Assistant</span>
                      </div>
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-ghibli-brown/60 rounded-full animate-dot-pulse"></div>
                        <div className="h-2 w-2 bg-ghibli-brown/60 rounded-full animate-dot-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 bg-ghibli-brown/60 rounded-full animate-dot-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="pt-4 border-t border-ghibli-yellow/20">
                <div className="mb-3">
                  <p className="text-sm text-ghibli-brown mb-2">Common questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {faqs.map((faq, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="bg-ghibli-yellow/10 border-ghibli-yellow/20 text-ghibli-brown hover:bg-ghibli-yellow/20 text-xs"
                        onClick={() => setFaq(faq)}
                      >
                        {faq}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    className="ghibli-input"
                    placeholder="Type your message here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    className="ghibli-btn px-4"
                    onClick={handleSend}
                    disabled={input.trim() === '' || isTyping}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ChatSupport;