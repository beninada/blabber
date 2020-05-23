import React, { useState } from 'react';
import styles from './Home.css';

export default function Home() {
  const [host, setHost] = useState('echo.websocket.org');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState(null);
  // const [activeRequest, setActiveRequest] = useState(null);

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

  // function handleRequestListItemClick(event) {
  //   event.preventDefault();
  //   setActiveRequest(event.target.href);
  //   setHost(event.target.href);
  // }

  return (
    <div>
      <div className={styles.container} data-tid="container">
        <div className={styles.sidebar}>
          <div className={styles.header}>Blabber</div>
          <ul className={styles.requestList}>
            <li
              className={`${styles.requestListItem} ${styles.requestListItemActive}`}
            >
              echo.websocket.org
            </li>
            <li className={styles.requestListItem}>demos.kaazing.com/echo</li>
          </ul>
        </div>
        <div>
          <div className={styles.requestBar}>
            <span className={styles.protocol}>wss://</span>
            <input
              className={styles.host}
              type="text"
              placeholder="echo.websocket.org"
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
