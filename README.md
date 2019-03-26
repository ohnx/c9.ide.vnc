# c9.ide.vnc

VNC client in cloud9. Inspired by https://github.com/shadowcodex/c9.ide.desktop
but I had issues getting that one to work, so I decided to rewrite it using
an API to embed noVNC instead of an iFrame or whatever.

## Build notes

1. Clone novnc `git submodule update`
2. run `npm install` in the root there
3. run `./utils/use_require.js --as amd` (still in the root there)

## Setup notes

This is what I do to make things work.  Run all concurrently.

1. `/usr/bin/Xvfb :1 -screen 0 1920x1080x16`
2. `/usr/bin/x11vnc -rfbport 5901 -display :1`
3. `DISPLAY=:1 openbox`

## Systemd configuration files

### `xvfb.service`
```
[Unit]
Description=Xvfb virtual display
After=syslog.target network-online.target

[Service]
Type=simple
User=ohnx
ExecStart=/usr/bin/Xvfb :1 -screen 0 1920x1080x16
Restart=on-failure
RestartSec=3
KillMode=process

[Install]
WantedBy=multi-user.target
```

### `x11vnc.service`
```
[Unit]
Description=VNC server for Xvfb
After=syslog.target network-online.target xvfb.service

[Service]
Type=simple
User=ohnx
ExecStart=/usr/bin/x11vnc -rfbport 5901 -display :1
Restart=always
RestartSec=3
KillMode=process

[Install]
WantedBy=multi-user.target
```

### `openbox.service`

```
[Unit]
Description=Openbox window manager
After=syslog.target network-online.target xvfb.service

[Service]
Type=simple
User=ohnx
Environment="DISPLAY=:1"
ExecStart=/usr/bin/openbox
Restart=on-failure
RestartSec=3
KillMode=process

[Install]
WantedBy=multi-user.target
```
