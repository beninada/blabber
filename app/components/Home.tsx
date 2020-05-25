import React, { useState, useEffect } from 'react';
import {
  createStyles,
  makeStyles,
  createMuiTheme,
  ThemeProvider
} from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { v4 as uuidv4 } from 'uuid';
import styles from './Home.css';

interface Request {
  uuid: string;
  name: string;
  url: string;
  message: string;
}

const useStyles = makeStyles(() =>
  createStyles({
    requestBarButton: {
      color: '#fff'
    }
  })
);

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark'
  }
});

export default function Home() {
  const [name, setName] = useState('');
  const [response, setResponse] = useState(null);
  const [activeRequest, setActiveRequest] = useState<Request>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const classes = useStyles();

  useEffect(() => {
    const result = localStorage.getItem('requests');

    if (!result) {
      const data = [
        {
          uuid: 'feafewfew-ffef3f3-f2f2',
          name: 'foo',
          url: 'echo.websocket.org',
          message: 'test 123'
        },
        {
          uuid: 'fewafewa01-33f32q-fefe32',
          name: 'bar',
          url: 'demos.kaazing.com/echo',
          message: 'test 456'
        }
      ];
      localStorage.setItem('requests', JSON.stringify(data));
      setRequests(data);
    } else {
      setRequests(JSON.parse(result));
    }
  }, []);

  function handleSendRequest() {
    const ws = new WebSocket('wss://echo.websocket.org');

    ws.onopen = () => {
      ws.send(activeRequest.message);
    };

    ws.onmessage = event => {
      setResponse(event.data);
    };
  }

  function handleRequestBarClickSave() {
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
  }

  function handleDialogClickSave() {
    requests.push();
    localStorage.setItem('requests', JSON.stringify(requests));
    setIsDialogOpen(false);
  }

  function handleUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    // setUrl(event.target.value);
  }

  function handleMessageChange(event: React.ChangeEvent<HTMLInputElement>) {
    // setMessage(event.target.value);
  }

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleRequestListItemClick(uuid: string) {
    const request = requests.filter(r => r.uuid === uuid)[0];
    setActiveRequest(request);
    setResponse(null);
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div>
        <div className={styles.container} data-tid="container">
          <div className={styles.sidebar}>
            <div className={styles.header}>Blabber</div>
            <ul className={styles.requestList}>
              {requests.map(item => {
                return (
                  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
                  <li
                    key={item.uuid}
                    onClick={() => handleRequestListItemClick(item.uuid)}
                    onKeyDown={() => handleRequestListItemClick(item.uuid)}
                    className={`${styles.requestListItem} ${
                      activeRequest && activeRequest.uuid === item.uuid
                        ? styles.requestListItemActive
                        : ''
                    }`}
                  >
                    {item.name}
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className={styles.requestBar}>
              <span className={styles.protocol}>wss://</span>
              <input
                className={styles.host}
                type="text"
                placeholder="test.sockets.com"
                value={activeRequest ? activeRequest.url : ''}
                onChange={handleUrlChange}
              />
              <Button
                className={classes.requestBarButton}
                onClick={handleSendRequest}
              >
                Send
              </Button>
              <Button
                className={classes.requestBarButton}
                onClick={handleRequestBarClickSave}
              >
                Save
              </Button>
              <Dialog
                open={isDialogOpen}
                onClose={handleCloseDialog}
                aria-labelledby="form-dialog-title"
              >
                <DialogTitle id="form-dialog-title">Save Request</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Enter a name for your request
                  </DialogContentText>
                  <TextField
                    onChange={handleNameChange}
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Name"
                    fullWidth
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog} color="primary">
                    Cancel
                  </Button>
                  <Button onClick={handleDialogClickSave} color="primary">
                    Save
                  </Button>
                </DialogActions>
              </Dialog>
            </div>
            <div className={styles.messageBar}>
              Message:
              <input
                className={styles.message}
                type="text"
                placeholder="A check one, two"
                value={activeRequest ? activeRequest.message : ''}
                onChange={handleMessageChange}
              />
            </div>
            <div className={styles.response}>{response}</div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
