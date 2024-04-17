import React, {useCallback, useEffect, useState} from 'react';
import './ChatBlock.css';



const ChatBlock = React.memo(({ isMenuOpen }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [textareaRef, setTextareaRef] = useState(null);
  const [isTextareaBlocked, setIsTextareaBlocked] = useState(false);

  useEffect(() => {
    const initialServerMessage = {
      text: "Hi! I'm the Cyber IP & IT Doggie AI expert. I can guide you through many tasks related to Intellectual Property Rights for startups. And in case you have a really advanced question - I can call the real human IP expert for you.",
      sender: 'received-message',
      isError: false,
    };
    setMessages([initialServerMessage]);
  }, []);

  const autoExpandTextarea = useCallback(() => {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      textareaRef.style.height = `${textareaRef.scrollHeight}px`;
    }
  }, [textareaRef]);

  const handleInput = (event) => {
    let inputValue = event.target.value;

    const formattedInputValue = inputValue.includes('\n') && !event.shiftKey
      ? inputValue.replace(/\n/g, '<br>')
      : inputValue;

    inputValue = formattedInputValue.replace(/<br>/g, '\n');

    setInputValue(inputValue);
    autoExpandTextarea();
  };

  const handleSendMessage = useCallback(async () => {
    if (inputValue.trim() !== '' && !isSending) {
      setIsSending(true);
      setIsTextareaBlocked(true);

      const userMessage = { text: inputValue, sender: 'user-message' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);


      setInputValue('');

      try {
        const allMessages = [...messages, userMessage];

        const messagesPayload = {
          role: 'user',
          content: allMessages.map((message) => message.text).join('\n'),
        };
        
        const apiUrl = process.env.REACT_APP_API_URL;
        
        const response = await fetch('https://prod-42.eastus.logic.azure.com:443/workflows/c51e23301b734e1f804360cda4a41bd3/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=wXuSBIGmNG5yJ7aEf45ED8NK6bRYpv3sQ57idTseuWs&profile=empty', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([messagesPayload]),
        });

        const data = await response.text();

        const isError = data.includes('"error":{');
        const receivedMessage = { text: data, sender: 'received-message', isError };

        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      } catch (error) {
        console.error('Error sending the request:', error);
      }

      setIsSending(false);
      setIsTextareaBlocked(false);

      autoExpandTextarea();
    }
  }, [inputValue, autoExpandTextarea, messages, isSending]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      const currentCursorPosition = textareaRef.selectionStart;
      const currentInputValue = inputValue;

      const textBeforeCursor = currentInputValue.slice(0, currentCursorPosition);
      const textAfterCursor = currentInputValue.slice(currentCursorPosition);

      const newInputValue = `${textBeforeCursor}\n${textAfterCursor}`;

      setInputValue(newInputValue);
      const newCursorPosition = currentCursorPosition + 1;
      textareaRef.setSelectionRange(newCursorPosition, newCursorPosition);

      autoExpandTextarea();
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-block">
      <div className="message-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.isError ? (
              <div className="error-icon">
                <span role="img" aria-label="Warning">⚠️</span> Failed getting the answer
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-line' }}>{message.text}</div>
            )}
          </div>
        ))}
      </div>
      <div className="chat-input-container">
        <textarea
          ref={(ref) => setTextareaRef(ref)}
          className="chat-input"
          value={inputValue}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message"
          readOnly={isTextareaBlocked}
        />
        <button
          className={`sent-btn ${isSending ? 'sending' : ''}`}
          onClick={handleSendMessage}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
});

export default ChatBlock;
