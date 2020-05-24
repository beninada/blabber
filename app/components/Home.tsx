import React, { useState } from 'react';
import styles from './Home.css';

export default function Home() {
  const [host, setHost] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  function sendRequest() {
    const ws = new WebSocket('wss://echo.websocket.org');

    ws.onopen = () => {
      ws.send(message);
    };

    ws.onmessage = event => {
      setResponse(event.data);
    };
  }

  function handleHostChange(event) {
    setHost(event.target.value);
  }

  function handleMessageChange(event) {
    setMessage(event.target.value);
  }

  function handleRequestListItemClick(event) {
    event.preventDefault();
    setActiveRequest(event.target.value);
    setHost(event.target.value);
    setMessage('');
    setResponse(null);
  }

  return (
    <div>
      <div className={styles.container} data-tid="container">
        <div className={styles.sidebar}>
          <div className={styles.header}>Blabber</div>
          <ul className={styles.requestList}>
            <li
              className={`${styles.requestListItem} ${
                activeRequest === 'echo.websocket.org'
                  ? styles.requestListItemActive
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={handleRequestListItemClick}
                value="echo.websocket.org"
              >
                echo.websocket.org
              </button>
            </li>
            <li
              className={`${styles.requestListItem} ${
                activeRequest === 'demos.kaazing.com/echo'
                  ? styles.requestListItemActive
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={handleRequestListItemClick}
                value="demos.kaazing.com/echo"
              >
                demos.kaazing.com/echo
              </button>
            </li>
          </ul>
        </div>
        <div>
          <div className={styles.requestBar}>
            <span className={styles.protocol}>wss://</span>
            <input
              className={styles.host}
              type="text"
              placeholder="test.sockets.com"
              value={host}
              onChange={handleHostChange}
            />
            <button
              type="button"
              className={styles.sendButton}
              onClick={sendRequest}
            >
              Send
            </button>
          </div>
          <div className={styles.messageBar}>
            Message:
            <input
              className={styles.message}
              type="text"
              placeholder="A check one, two"
              value={message}
              onChange={handleMessageChange}
            />
          </div>
          <div className={styles.response}>{response}</div>
        </div>
      </div>
    </div>
  );
}
