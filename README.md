# c9.ide.vnc

VNC client in cloud9. Inspired by https://github.com/shadowcodex/c9.ide.desktop
but I had issues getting that one to work, so I decided to rewrite it using
an API to embed noVNC instead of an iFrame or whatever.

## Build notes

1. Clone novnc `git submodule update`
2. run `npm install` in the root there
3. run `./utils/use_require.js --as amd` (still in the root there)

## Setup notes

I personally like to use the TigerVNC server because it supports resizing of
the window. In my `~/.vnc/` folder, I have all the `xstartup` and `passwd`
options set up.

### Sample systemd configuration file

```
[Unit]
Description=TigerVNC server
After=syslog.target network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/sudo -u c9 -H /bin/bash -c "/usr/bin/vncserver :2; websockify localhost:8098 localhost:5902"
Environment="HOME=/home/c9"
Restart=on-failure
RestartSec=10
KillMode=process

[Install]
WantedBy=multi-user.target
```
