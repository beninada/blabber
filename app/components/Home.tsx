/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import { ipcRenderer } from 'electron';
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
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Input from '@material-ui/core/Input';
import { v4 as uuidv4 } from 'uuid';
import styles from './Home.css';

interface Request {
  uuid: string;
  name: string;
  protocol: string;
  url: string;
  message: string;
}

const theme = createMuiTheme({
  palette: {
    type: 'dark'
  }
});

const useStyles = makeStyles(() =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 100
    },
    requestBarButton: {
      color: '#fff'
    }
  })
);

export default function Home() {
  const [response, setResponse] = useState('');
  const [activeRequest, setActiveRequest] = useState<Request | undefined>(
    undefined
  );
  const [requests, setRequests] = useState<Request[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const classes = useStyles();

  useEffect(() => {
    const result = localStorage.getItem('requests');

    if (!result) {
      const data = [
        {
          uuid: 'feafewfew-ffef3f3-f2f2',
          name: 'Websocket Example',
          protocol: 'wss',
          url: 'echo.websocket.org',
          message: 'Test 123'
        },
        {
          uuid: 'fewafewa01-33f32q-fefe32',
          name: 'ZeroMQ Example',
          protocol: 'tcp',
          url: '127.0.0.1:3000',
          message: 'Echo'
        }
      ];
      localStorage.setItem('requests', JSON.stringify(data));
      setRequests(data);
    } else {
      setRequests(JSON.parse(result));
    }
  }, []);

  function saveActiveRequest() {
    if (!activeRequest) {
      return;
    }

    let requestsCopy = [...requests];

    // If this is a new request, it does not have a uuid, so we need to
    // generate one for it. Otherwise, we remove the old request and
    // replace it with the new one.
    if (!activeRequest.uuid) {
      activeRequest.uuid = uuidv4();
    } else {
      requestsCopy = requestsCopy.filter(r => r.uuid !== activeRequest.uuid);
    }

    requestsCopy.push(activeRequest);

    // Update state and local storage
    setRequests(requestsCopy);
    localStorage.setItem('requests', JSON.stringify(requestsCopy));
  }

  function handleSendRequest() {
    if (!activeRequest) {
      return;
    }

    if (activeRequest.protocol === 'tcp') {
      // Add the event listener for the response from the main process
      ipcRenderer.on('mainprocess-response', (event, arg) => {
        setResponse(new TextDecoder('utf-8').decode(arg));
      });

      // Send information to the main process
      ipcRenderer.send('request-mainprocess-action', {
        url: `${activeRequest.protocol}://${activeRequest.url}`,
        message: activeRequest.message
      });
    } else {
      const ws = new WebSocket(
        `${activeRequest.protocol}://${activeRequest.url}`
      );

      ws.onopen = () => {
        ws.send(activeRequest.message);
      };

      ws.onmessage = event => {
        setResponse(event.data);
      };
    }
  }

  function handleRequestBarClickSave() {
    if (!activeRequest) {
      return;
    }

    // If this is a new request, it does not have a uuid, so we open
    // a dialog for the user to enter a name for it.
    if (!activeRequest.uuid) {
      setIsDialogOpen(true);
    } else {
      saveActiveRequest();
    }
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
  }

  function handleDialogClickSave() {
    saveActiveRequest();
    setIsDialogOpen(false);
  }

  function handleUrlChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!activeRequest) {
      return;
    }
    setActiveRequest({
      ...activeRequest,
      url: event.target.value
    });
  }

  function handleMessageChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!activeRequest) {
      return;
    }
    setActiveRequest({
      ...activeRequest,
      message: event.target.value
    });
  }

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!activeRequest) {
      return;
    }
    setActiveRequest({
      ...activeRequest,
      name: event.target.value
    });
  }

  function handleProtocolChange(
    event: React.ChangeEvent<{ name?: string; value: unknown }>
  ) {
    if (!activeRequest) {
      return;
    }
    setActiveRequest({
      ...activeRequest,
      protocol: event.target.value as string
    });
  }

  function handleRequestListItemClick(uuid: string) {
    const request = requests.filter(r => r.uuid === uuid)[0];
    setActiveRequest(request);
    setResponse('');
  }

  function handleNewRequestClick() {
    setActiveRequest({
      uuid: '',
      name: '',
      url: '',
      message: '',
      protocol: 'wss'
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <div className={styles.container} data-tid="container">
          <div className={styles.sidebar}>
            <div className={styles.header}>Blabber</div>
            <ul className={styles.requestList}>
              {requests.map(item => {
                return (
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
              <li
                className={styles.requestListItem}
                onClick={handleNewRequestClick}
                onKeyDown={handleNewRequestClick}
              >
                + New Request
              </li>
            </ul>
          </div>
          <div>
            <div className={styles.requestBar}>
              {/* <span className={styles.protocol}>wss://</span> */}
              <FormControl
                variant="outlined"
                size="small"
                className={classes.formControl}
              >
                <Select
                  labelId="demo-simple-select-outlined-label"
                  id="demo-simple-select-outlined"
                  value={activeRequest ? activeRequest.protocol : 'wss'}
                  onChange={handleProtocolChange}
                >
                  <MenuItem value="wss">wss://</MenuItem>
                  <MenuItem value="ws">ws://</MenuItem>
                  <MenuItem value="tcp">tcp://</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <Input
                  placeholder="test.sockets.com"
                  value={activeRequest ? activeRequest.url : ''}
                  fullWidth
                  onChange={handleUrlChange}
                />
              </FormControl>
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
