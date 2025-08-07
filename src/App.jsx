import React, { useRef, useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import axios from 'axios';
import './App.css';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [monacoInstance, setMonacoInstance] = useState(null);
  const monacoRef = useRef(null);
  const fileInputRef = useRef();

  useEffect(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.command === 'openFileInMonaco') {
        setFileName(message.fileName);
        setFileContent(message.content);
        setShowFilePanel(true);
      }
    });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFileContent(ev.target.result);
      setShowFilePanel(true);
    };
    reader.readAsText(file);
  };

  const handleUploadSelection = () => {
    if (!monacoInstance) return;
    const selection = monacoInstance.getSelection();
    const selectedText = monacoInstance.getModel().getValueInRange(selection);
    if (selectedText && selectedText.trim().length > 0) {
      let current = input;
      if (current && !current.endsWith('\n')) current += '\n';
      setInput(`${current}\n\n\`\`\`\n${selectedText}\n\`\`\`\n`);
    }
  };

 const handleSend = async () => {
  if (!input.trim()) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  setMessages((msgs) => [{ role: 'user', text: input, timestamp: now }, ...msgs]);
  setInput('');
  setMessages((msgs) => [{ role: 'assistant', text: '⏳ Thinking...', timestamp: now }, ...msgs]);

  try {
    const url = 'https://luminos.app.n8n.cloud/webhook/75218963-0545-4924-971c-69ee1fb460bc';
    const payload = {
      question: input,
      context: monacoInstance ? monacoInstance.getValue().trim() : '',
      'maybe more in the future': 'extension-v1'
    };
    const response = await axios.post(url, payload);
    const responseTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((msgs) => [
      { role: 'assistant', text: response.data?.result || '❌ No "result" field in response', timestamp: responseTimestamp },
      ...msgs.slice(1),
    ]);
  } catch (err) {
    const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((msgs) => [
      { role: 'assistant', text: `❌ API error: ${err.message}`, timestamp: errorTimestamp },
      ...msgs.slice(1),
    ]);
  }
};


  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container">
      <div className="chat-panel">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              👋 Welcome to Luminos Chat! I can help you with your code.
              Try asking me questions or attach a file to get started.
            </div>
          )}
          {messages.map((msg, i) => {
            return(
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-text">{msg.text}</div>
              <div className="time-text">{msg.timestamp}</div>
            </div>
          )})}
        </div>

        <div className="input-container">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={3}
            placeholder="Ask me anything..."
          >
          <button className='attachBtn' onClick={() => fileInputRef.current.click()}>📎 Add Context</button>
          </textarea>
          <button className='askBtn' onClick={handleSend} disabled={!input.trim()}>Ask</button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {showFilePanel && (
        <div className="file-panel">
          <div className="file-header">
            <span>{fileName}</span>
            <button onClick={() => setShowFilePanel(false)}>✕</button>
          </div>
          <MonacoEditor
            height="200px"
            language="javascript"
            value={fileContent}
            onMount={(editor, monaco) => {
              setMonacoInstance(editor);
              monacoRef.current = editor;
            }}
            options={{
              theme: 'vs-dark',
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />
          <button onClick={handleUploadSelection}>Apply Changes</button>
        </div>
      )}
    </div>
  );
}
