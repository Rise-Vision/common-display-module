# common-display-module

This is a library of utility functions that are common to Display Modules.

A Display Module should be packaged as a self executing archive that can be extracted on windows via;

``` bash
[archive.exe] -InstallPath="[targetpath]"
```

That should result in extracted contents into [targetpath] which can then be started via

``` bash
node [targetpath]
```

Display modules should be downloadable from a publicly available https URL.

## Heartbeat

A heartbeat loop is called when a module calls receiveMessages(moduleName).
If that function is not called by a module, modules should explicitly call:

``` javascript
  heartbeat.startHeartbeatInterval(moduleName);
```

once they have connected successfully to local-messaging-module.
