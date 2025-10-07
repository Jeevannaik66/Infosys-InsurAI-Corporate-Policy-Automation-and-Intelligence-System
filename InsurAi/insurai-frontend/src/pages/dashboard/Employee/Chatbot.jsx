import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot = ({ employeeData = { name: 'Employee', claims: [], policies: [] } }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your InsurAI assistant. Ask me anything about your claims or policies. 🤖", sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBodyRef = useRef(null);

  // Auto-scroll when messages update
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Local small talk & greetings
  const getLocalResponse = (input) => {
    if (!input) return null;
    const text = input.toLowerCase().trim();

    if (["hi", "hello", "hey"].includes(text)) 
      return `Hello 👋 ${employeeData.name}! How can I assist you today — claims, policies, or support?`;

    if (text.includes("thank")) 
      return "You're welcome! 😊";

    if (text.includes("bye")) 
      return "Goodbye! Have a great day 👋";

    if (text.includes("how are you")) 
      return "I'm doing great, thank you! How about you?";

    return null; // forward other queries to backend AI
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    const localReply = getLocalResponse(inputValue);
    if (localReply) {
      setMessages(prev => [...prev, { text: localReply, sender: 'bot' }]);
      setLoading(false);
      return;
    }

    // Get JWT token
    const token = localStorage.getItem('token');
    if (!token) {
      setMessages(prev => [...prev, { text: "⚠️ Please log in to use InsurAI.", sender: 'bot' }]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:8080/employee/chatbot',
        { message: userMessage.text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const reply = response?.data?.response || "🤖 Sorry, I didn’t catch that.";
      const formattedReply = reply.split("\n").map(line => line.trim()).join("\n");

      setMessages(prev => [...prev, { text: formattedReply, sender: 'bot' }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      let msg = "⚠️ Unable to reach InsurAI. Please try again later.";
      if (error.response?.status === 401) msg = "⚠️ Authentication failed. Please log in.";
      else if (error.response?.status === 403) msg = "⚠️ Access forbidden. Please check your permissions.";
      setMessages(prev => [...prev, { text: msg, sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage(e);
  };

  // Inline styles
  const styles = {
    chatIcon: { position: 'fixed', bottom: '25px', right: '25px', width: '60px', height: '60px', backgroundColor: '#007bff', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', zIndex: 1000 },
    chatWindow: { position: 'fixed', bottom: '100px', right: '25px', width: '350px', height: '450px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1000 },
    header: { backgroundColor: '#007bff', color: 'white', padding: '1rem', fontWeight: 'bold', textAlign: 'center' },
    body: { flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#f4f7f9' },
    message: { marginBottom: '1rem', maxWidth: '80%', padding: '0.6rem 0.9rem', borderRadius: '18px', lineHeight: '1.4', whiteSpace: 'pre-wrap' },
    botMessage: { backgroundColor: '#e9e9eb', color: '#333', alignSelf: 'flex-start' },
    userMessage: { backgroundColor: '#007bff', color: 'white', marginLeft: 'auto' },
    footer: { padding: '0.5rem', borderTop: '1px solid #ddd' },
    form: { display: 'flex', gap: '0.5rem' },
    input: { flex: 1, padding: '0.8rem', border: '1px solid #ccc', borderRadius: '20px', outline: 'none' },
    button: { padding: '0.8rem 1rem', border: 'none', backgroundColor: '#007bff', color: 'white', borderRadius: '20px', cursor: 'pointer' },
    loading: { fontStyle: 'italic', color: '#555', marginBottom: '1rem' }
  };

  return (
    <>
      <div style={styles.chatIcon} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'X' : '💬'}
      </div>

      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>InsurAI Assistant</div>
          <div style={styles.body} ref={chatBodyRef}>
            {messages.map((msg, index) => (
              <div key={index} style={{ display: 'flex' }}>
                <div style={{ ...styles.message, ...(msg.sender === 'bot' ? styles.botMessage : styles.userMessage) }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div style={styles.loading}>🤖 InsurAI is typing...</div>}
          </div>
          <div style={styles.footer}>
            <form onSubmit={handleSendMessage} style={styles.form}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                style={styles.input}
                placeholder="Ask a question..."
              />
              <button type="submit" style={styles.button}>Send</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
