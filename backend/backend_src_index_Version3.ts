import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { EchoFPSRoom } from "./rooms/EchoFPSRoom";

const port = Number(process.env.PORT) || 2567;
const app = express();
const gameServer = new Server({ server: createServer(app) });

gameServer.define("echofps", EchoFPSRoom);

gameServer.listen(port);
console.log(`EchoFPS backend listening on ws://localhost:${port}`);