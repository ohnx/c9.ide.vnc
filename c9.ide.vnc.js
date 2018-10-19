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

            var container, viewer, hostfield, passwordfield, btnConnect, btnCAD;
            var rfb, host, connected = false, password;

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

                doc.tab.on("setPath", setTitle, session);

                function setTitle(e) {
                    var desktopname = e.detail.name;

                    // Caption is the filename
                    doc.title = desktopname;

                    // Tooltip is the full path
                    doc.tooltip = host + " - " + desktopname;
                }
                setTitle({detail: {name: "VNC Viewer"}});

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
                    console.log("Connected to " + host);
                    btnConnect.innerHTML = "Disconnect";
                    connected = true;
                }
        
                // This function is called when we are disconnected
                function disconnectedFromServer(e) {
                    if (e.detail.clean) {
                        console.log("Disconnected");
                    } else {
                        console.log("Something went wrong, connection is closed");
                    }
                    btnConnect.innerHTML = "Connect";
                    connected = false;
                }

                function initiateConnection() {
                    if (rfb != null) return;

                    host = hostfield.value;
                    rfb = new RFB(viewer, host, { credentials: { password: passwordfield.value } });
                    rfb.addEventListener("connect",  connectedToServer);
                    rfb.addEventListener("disconnect", disconnectedFromServer);
                    rfb.addEventListener("desktopname", setTitle);
                }

                viewer = container.querySelector(".vnc-viewer");
                hostfield = container.querySelector(".vnc-viewer-host");
                passwordfield = container.querySelector(".vnc-viewer-password");
                btnConnect = container.querySelector(".vnc-viewer-connectbtn");
                btnCAD = container.querySelector(".vnc-viewer-ctrlaltdel");

                initiateConnection();

                btnConnect.addEventListener("click", function() {
                    if (connected) {
                        rfb.disconnect();
                        rfb = null;
                    } else {
                        initiateConnection();
                    }
                });

                btnCAD.addEventListener("click", function() {
                    rfb.sendCtrlAltDel();
                });
            });
            plugin.on("documentActivate", function(e){
                
            });
            plugin.on("documentUnload", function(e){
                
            });
            plugin.on("resize", function(){

            });

            plugin.freezePublicAPI({

            });

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
                    }, function(err, tab) {console.log(err)});
                }
            }, handle);

            menus.addItemByPath("Window/VNC Viewer", new ui.item({
                command: "open_vnc"
            }), 102, handle);
        });

        register(null, {
            "c9.ide.vnc": handle
        });
    }
});
