# planetside-server
Server for the Planetside project.

This module is the central application. It listens on the PlanetSide 2 websocket event stream,
manages current metagame events (alerts), player sessions, and serves an Ember webapp with interfaces
to the static Census API.