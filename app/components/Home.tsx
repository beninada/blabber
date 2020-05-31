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
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import { v4 as uuidv4 } from 'uuid';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-plain_text';
import 'ace-builds/src-noconflict/theme-monokai';
import styles from './Home.css';

interface Request {
  uuid: string;
  name: string;
  protocol: string;
  url: string;
  message: string;
  encoding: string;
  created_at: Date | null;
  updated_at: Date | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const theme = createMuiTheme({
  palette: {
    type: 'dark'
  }
});

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function Home() {
  const [response, setResponse] = useState('');
  const [activeRequest, setActiveRequest] = useState<Request | undefined>(
    undefined
  );
  const [requests, setRequests] = useState<Request[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isEncodingChecked, setIsEncodingChecked] = useState(false);

  const useStyles = makeStyles(() =>
    createStyles({
      container: {
        display: 'grid',
        gridTemplateColumns: response ? '200px 7fr 3fr' : '200px 7fr',
        gridTemplateRows: '1fr 0',
        height: '100vh'
      },
      main: {
        display: 'grid',
        gridTemplateRows: '60px 50px 4fr auto'
      },
      formControl: {
        margin: theme.spacing(1),
        minWidth: 100
      },
      requestBarButton: {
        color: '#fff'
      },
      encodingCheckboxLabel: {
        fontSize: '.9rem'
      },
      response: {
        padding: '20px',
        background: '#1b1b1b',
        wordWrap: 'break-word',
        wordBreak: 'break-all'
      }
    })
  );

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
          message: 'Test 123',
          encoding: 'utf8',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          uuid: 'fewafewa01-33f32q-fefe32',
          name: 'ZeroMQ Example',
          protocol: 'tcp',
          url: '127.0.0.1:3000',
          message: 'Echo',
          encoding: 'utf8',
          created_at: new Date(),
          updated_at: new Date()
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
    let activeRequestCopy = { ...activeRequest };

    // If this is a new request, it does not have a uuid, so we need to
    // generate one for it. Otherwise, we remove the old request and
    // replace it with the new one.
    if (!activeRequestCopy.uuid) {
      activeRequestCopy = {
        ...activeRequestCopy,
        uuid: uuidv4(),
        created_at: new Date()
      };
    } else {
      requestsCopy = requestsCopy.filter(
        r => r.uuid !== activeRequestCopy.uuid
      );
    }

    // Update the updated timestamp
    activeRequestCopy.updated_at = new Date();

    requestsCopy.push(activeRequestCopy);

    // Update state and local storage
    setRequests(requestsCopy);
    localStorage.setItem('requests', JSON.stringify(requestsCopy));
  }

  function handleSendRequest() {
    if (!activeRequest) {
      return;
    }

    let { message } = activeRequest;

    // If the encoding checkbox is checked, create a buffer from the
    // (assumed) provided base64 string
    if (isEncodingChecked) {
      message = Buffer.from(message, 'base64');
    }

    if (activeRequest.protocol === 'tcp') {
      // Add the event listener for the response from the main process
      ipcRenderer.on('mainprocess-response', (event, arg) => {
        setResponse(new TextDecoder('utf-8').decode(arg));
      });

      // Send information to the main process
      try {
        ipcRenderer.send('request-mainprocess-action', {
          url: `${activeRequest.protocol}://${activeRequest.url}`,
          message
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      const ws = new WebSocket(
        `${activeRequest.protocol}://${activeRequest.url}`
      );

      ws.onopen = () => {
        try {
          ws.send(message);
        } catch (e) {
          console.error(e);
        }
      };

      ws.onmessage = async event => {
        const { data } = event;

        try {
          if (data instanceof Blob) {
            setResponse(await data.text());
          } else {
            setResponse(data);
          }
        } catch (e) {
          console.error(e);
        }
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

  function handleMessageChange(message) {
    if (!activeRequest) {
      return;
    }
    setActiveRequest({
      ...activeRequest,
      message
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
      protocol: 'wss',
      url: '',
      message: '',
      encoding: 'utf8',
      created_at: null,
      updated_at: null
    });
  }

  function handleTabValueChange(
    event: React.ChangeEvent<{}>,
    newValue: number
  ) {
    setTabValue(newValue);
  }

  function handleEncodingCheckboxChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!activeRequest) {
      return;
    }
    setIsEncodingChecked(event.target.checked);
    setActiveRequest({
      ...activeRequest,
      encoding: event.target.checked ? 'base64' : 'utf8'
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div>
        <div className={classes.container} data-tid="container">
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
          <div className={classes.main}>
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
            <Tabs value={tabValue} onChange={handleTabValueChange}>
              <Tab label="Message" />
              <Tab label="Test" />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              <AceEditor
                mode="plain_text"
                theme="monokai"
                onChange={handleMessageChange}
                value={activeRequest ? activeRequest.message : ''}
                showGutter={false}
                tabSize={2}
                height="100%"
                width="unset"
                showPrintMargin={false}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              Coming soon
            </TabPanel>
            {tabValue === 0 && (
              <div>
                <Checkbox
                  checked={isEncodingChecked}
                  onChange={handleEncodingCheckboxChange}
                  size="small"
                  name="checkedEncoding"
                  color="primary"
                />
                <span>base64</span>
              </div>
            )}
          </div>
          <div className={classes.response}>{response}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}
