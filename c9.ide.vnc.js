define(function(require, exports, module) {
    main.consumes = ["Editor", "editors", "ui", "settings", "layout", "Plugin", "menus", "commands", "tabManager"];
    main.provides = ["c9.ide.vnc"];
    return main;

    function main(options, imports, register) {
        var Editor = imports.Editor;
        var editors = imports.editors;
        var ui = imports.ui;
        var settings = imports.settings;
        var layout = imports.layout;
        var menus = imports.menus;
        var commands = imports.commands;
        var tabManager = imports.tabManager;

        var RFB = require("./novnc/lib/rfb").default;

        // Register the editor
        var handle = editors.register("vnc", "VNC Viewer", VNCViewer, []);
        ui.insertCss(require("text!./style.css"), null, handle);

        var BGCOLOR = {
            "flat-light": "#F1F1F1", 
            "light": "#D3D3D3", 
            "light-gray": "#D3D3D3",
            "dark": "#3D3D3D",
            "dark-gray": "#3D3D3D"
        };

        function VNCViewer(){
            var plugin = new Editor("Ajax.org", main.consumes, []);

            var container, viewer, hostfield, passwordfield, resizefield, message, btnConnect, btnCAD, reconnectAttempts;
            var rfb, host, connected = false, desktopname, consecutive_failures = 0;

            plugin.on("draw", function(e) {
                container = e.htmlNode;

                ui.insertHtml(container, require("text!./viewer.html"), plugin);

                container.style.paddingTop = "0px";
            });

            plugin.on("focus", function(e) {

            });

            plugin.on("documentLoad", function(e){
                var doc = e.doc;
                var session = doc.getSession();

                doc.tab.on("setPath", updateTitle, session);

                function updateTitle() {
                    // Caption is the filename
                    doc.title = desktopname;

                    // Tooltip is the full path
                    if (connected)
                        doc.tooltip = host + " - " + desktopname;
                    else
                        doc.tooltip = desktopname + " (disconnected)";
                }
                desktopname = "VNC Viewer";
                updateTitle();

                function setTheme(e) {
                    var tab = doc.tab;
                    //var isDark = e.theme == "dark";

                    tab.backgroundColor = "#282828";//BGCOLOR[e.theme];
                    tab.classList.add("dark");

                    //if (isDark) tab.classList.add("dark");
                    //else tab.classList.remove("dark");
                }

                layout.on("themeChange", setTheme, session);
                setTheme({ theme: settings.get("user/general/@skin") });

                function connectedToServer(e) {
                    if (reconnectAttempts) clearInterval(reconnectAttempts);
                    reconnectAttempts = null;
                    message.innerHTML = "Connected to " + host;
                    btnConnect.innerHTML = "Disconnect";
                    connected = true;
                    updateTitle();
                    consecutive_failures = 0;

                    rfb.scaleViewport = resizefield.value === 'scale';
                    rfb.resizeSession = resizefield.value === 'remote';
                }

                // This function is called when we are disconnected
                function disconnectedFromServer(e) {
                    if (e.detail.clean) {
                        message.innerHTML = "Disconnected";
                    } else {
                        message.innerHTML = "Something went wrong, connection unexpectedly closed";
                        if (consecutive_failures < 3) {
                            reconnectAttempts = setTimeout(initiateConnection, 1000);
                        }
                    }
                    btnConnect.innerHTML = "Connect";
                    connected = false;
                    desktopname = "VNC Viewer";
                    updateTitle();
                    rfb = null;
                }

                function initiateConnection() {
                    if (rfb != null) return;

                    consecutive_failures++;
                    host = hostfield.value;
                    message.innerHTML = "Initiating connection to " + host + "...";
                    btnConnect.innerHTML = "Connecting...";
                    rfb = new RFB(viewer, host, { credentials: { password: passwordfield.value } });
                    rfb.addEventListener("connect",  connectedToServer);
                    rfb.addEventListener("disconnect", disconnectedFromServer);
                    rfb.addEventListener("desktopname", function (e) {
                        desktopname = e.detail.name;
                        updateTitle();
                    });
                }

                viewer = container.querySelector(".vnc-viewer");
                hostfield = container.querySelector(".vnc-viewer-host");
                passwordfield = container.querySelector(".vnc-viewer-password");
                resizefield = container.querySelector(".vnc-viewer-resize");
                message = container.querySelector(".vnc-viewer-message");
                btnConnect = container.querySelector(".vnc-viewer-connectbtn");
                btnCAD = container.querySelector(".vnc-viewer-ctrlaltdel");

                initiateConnection();

                resizefield.addEventListener("change", function() {
                    if (!connected || rfb == null) return;

                    rfb.scaleViewport = resizefield.value === 'scale';
                    rfb.resizeSession = resizefield.value === 'remote';
                });

                btnConnect.addEventListener("click", function() {
                    if (connected) {
                        rfb.disconnect();
                    } else {
                        initiateConnection();
                    }
                });

                btnCAD.addEventListener("click", function() {
                    rfb.sendCtrlAltDel();
                });
            });

            plugin.on("documentActivate", function(e){});
            plugin.on("documentUnload", function(e){});
            plugin.on("resize", function(){});

            plugin.freezePublicAPI({});

            plugin.load(null, "");

            return plugin;
        }

        handle.on("load", function() {
            commands.addCommand({
                name: "open_vnc",
                bindKey: {
                    mac: "Command-Alt-V", 
                    win: "Ctrl-Alt-V"
                },
                exec: function(){
                    tabManager.open({
                            focus: true,
                            pane: tabManager.getPanes()[0],
                            editorType: "vnc"
                    }, function(err, tab) {if(err) console.log(err)});
                }
            }, handle);

            menus.addItemByPath("Window/VNC Viewer", new ui.item({
                command: "open_vnc"
            }), 102, handle);

            menus.addItemToMenu(tabManager.getElement("mnuEditors"), 
                new ui.item({
                    caption: "New VNC Viewer",
                    hotkey: "commands.open_vnc",
                    onclick: function(e) {
                        tabManager.open({
                            focus: true,
                            pane: this.parentNode.pane,
                            editorType: "vnc"
                        }, function() {});
                    }
                }), 200, handle);
        });

        register(null, {
            "c9.ide.vnc": handle
        });
    }
});
