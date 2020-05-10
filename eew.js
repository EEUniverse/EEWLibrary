// singletons
const EEW_utf8TextDecoder = new TextDecoder("utf8");
const EEW_utfTextEncoder = new TextEncoder();

function createClient(auth, options, host = "wss://everybodyedits-universe.com/api/ws/") {
  return resolveSelfInfo(_createClient(auth, options, host));
}

function _createClient(auth, options, host = "wss://everybodyedits-universe.com/api/ws/") {
  if (typeof auth === 'string') {
    return resolveConnection(auth, options, host)
  }

  if (typeof auth === 'object') {
    if (!auth.username) return Promise.reject(new Error("'username' not found in authentication object."));
    if (!auth.password) return Promise.reject(new Error("'password' not found in authentication object."));

    return getToken(auth.username, auth.password, auth.endpoint || "https://everybodyedits-universe.com/api/auth/login")
      .then(token => resolveConnection(token, options, host));
  }
}

async function getToken(username, password, host) {
  const result = await fetch(host, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });
  
  if (result.status === 400) throw new Error("Invalid authentication credentials.");
  if (!result.ok) throw new Error("Authentication request failed.");

  const json = await result.json();
  if (!json.token) throw new Error(json.message);
  return json.token;
}

function resolveConnection(token, configure, host) {
  return new Promise((resolve, reject) => {
    try {
      const webSocket = new WebSocket(host + "?a=" + token);
      const client = new Client(webSocket);

      let resolved = false;
      webSocket.onopen = () => {
        resolved = true;
        resolve(client);
      };

      webSocket.onerror = (error) => {
        if (!resolved) {
          reject(error);
        }
      };

      webSocket.onclose = () => {
      };

      if (typeof configure === 'function') {
        configure(client);
      }
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * When the connection is resolved, messages cannot be sent until SelfInfo is sent. This ensures that no messages are
 * sent before SelfInfo is receieved.
 */
function resolveSelfInfo(connectionPromise) {
  return new Promise((resolve, reject) => {
    connectionPromise
    .then(connection => {
        let listener;
        listener = (sender, message) => {
          // we really don't need to care about what message it is - it should be selfinfo anyways
          connection.removeOnMessage(listener);
          resolve(connection);
        };

        connection.addOnMessage(listener);
      });
  });
}

class EffectData {
  constructor(effectData) {
    this.effectData = effectData;
  }
  serializeTo(args) {
    args.push(this.effectData);
  }
}

class SignData {
  constructor(text, rotation) {
    this.text = text;
    this.rotation = rotation;
  }
  serializeTo(args) {
    args.push(this.text);
    args.push(this.rotation);
  }
}

class PortalData {
  constructor(rotation, id, target, flipped) {
    this.rotation = rotation;
    this.id = id;
    this.target = target;
    this.flipped = flipped;
  }
  serializeTo(args) {
    args.push(this.rotation);
    args.push(this.id);
    args.push(this.target);
    args.push(this.flipped);
  }
}

class Client {
  constructor(webSocket) {
    const clientSelf = this;
    this._onMessages = [];

    this._webSocket = webSocket;

    this._webSocket.onerror = (error) => {
      console.error("websocket error:", error);
    };

    this._webSocket.binaryType = 'arraybuffer';
    this._webSocket.onmessage = (event) => {
      const message = deserialize(event.data);

      if (this.onMessage !== undefined) {
        this.onMessage(clientSelf, message);
      }

      if (this.room !== undefined && message.scope === 1 /* Room */) {
        this.room._handle(message);
      }

      if (message.scope === 2 /* Lobby */) {
        this.lobby._handle(message);
      }

      if (message.scope === 0 /* None */) {
        this.scopeless._handle(message);
      }
    };

    const rawSend = this._rawSend.bind(this);
    const lobby = {
      sendRoomConnect: (id) => rawSend(2 /* Lobby */, 0 /* RoomConnect */, ["world", id]),
      sendRoomDisconnect: () => rawSend(2 /* Lobby */, 1 /* RoomDisconnect */, []),
      sendLoadRooms: () => rawSend(2 /* Lobby */, 2 /* LoadRooms */, []),
      sendLoadStats: () => rawSend(2 /* Lobby */, 3 /* LoadStats */, []),
      send: (message) => rawSend(2 /* Lobby */, message.messageType, message.serialize()),
      disconnect: () => clientSelf.disconnect(),
    };

    lobby._handle = (message) => {
      const raw = message.data;

      switch (message.type) {
        case 0 /* RoomConnect */: {
          if (lobby.onRoomConnect) {
            lobby.onRoomConnect(lobby, {raw, id: raw[1]});
          }
        } break;
        case 1 /* RoomDisconnect */: {
          if (lobby.onRoomDisconnect) {
            lobby.onRoomDisconnect(lobby, {raw});
          }
        } break;
        case 2 /* LoadRooms */: {
          if (lobby.onLoadRooms) {
            let rooms = [];
            let messagePosition = 0;
            while (messagePosition < raw.length) {
              const room = {};
              room.id = raw[messagePosition++];
              room.playersOnline = raw[messagePosition++];
        
              const metaObject = raw[messagePosition++];
              room.name = metaObject.n;
              room.plays = metaObject.p;
              rooms.push(room);
            }

            lobby.onLoadRooms(lobby, {raw, rooms});
          }
        } break;
        case 3 /* LoadStats */: {
          if (lobby.onLoadStats) {
            lobby.onLoadStats(lobby, {raw, playersOnline: raw[0], roomsOnline: raw[1]});
          }
        } break;
      }
    };
    this.lobby = lobby;

    const scopeless = {
      sendNotify: (message) => rawSend(0 /* None */, 29 /* Notify */, [message]),
      send: (message) => rawSend(0 /* None */, message.messageType, message.serialize()),
      disconnect: () => clientSelf.disconnect(),
    };
    scopeless._handle = (message) => {
      const raw = message.data;

      switch (message.type) {
        case 23 /* SelfInfo */: {
          if (scopeless.onSelfInfo) {
            const rooms = [];
            const roomCount = raw[4];
            for (let i = 0; i < roomCount; i++) {
              const metaObject = raw[i + 5];
              rooms.push({
                id: metaObject.i,
                name: metaObject.n,
                plays: metaObject.p,
                visibility: metaObject.v,
              });
            }

            scopeless.onSelfInfo(scopeless, {
              raw,
              username: raw[0],
              maxEnergy: raw[1],
              stardust: raw[2],
              jewels: raw[3],
              rooms,
            });
          }
        } break;
      }
    };
    this.scopeless = scopeless;
  }

  connectToRoom(id, configure) {
    const self = this;
    const rawSend = this._rawSend.bind(this);
    return new Promise((resolve, reject) => {
      let listener;
      listener = (sender, message) => {
        if (message.scope === 2 /* Lobby */ && message.type === 0 /* RoomConnect */) {
          self.removeOnMessage(listener);

          if (message.data.length === 0) {
            reject("Room connection refused.");
          }
          else {
            const room = {
              sendRoomPing: () => rawSend(1 /* Room */, 1 /* Ping */, []),
              sendInit: (timeSinceCreation) => rawSend(1 /* Room */, 0 /* Init */, [timeSinceCreation]),
              sendPlayerMove: (t0, t1, arrowKeyX, arrowKeyY, playerDistanceX, playerDistanceY, playerVelocityX, playerVelocityY, playerAccelerationX, playerAccelerationY, playerRotation, edgeXVectorA, edgeYVectorA, edgeXVectorB, edgeYVectorB, edgeLineXVectorB, edgeLineYVectorB, edgeXVectorA2, edgeYVectorA2, edgeXVectorB2, edgeYVectorB2, edgeLineXVectorB2, edgeLineYVectorB2, reactionX, reactionY, centerX, centerY, blockSide, space, pressedSpace) =>
                rawSend(1 /* Room */, 8 /* PlayerMove */, [t0, t1, arrowKeyX, arrowKeyY, playerDistanceX, playerDistanceY, playerVelocityX, playerVelocityY, playerAccelerationX, playerAccelerationY, playerRotation, edgeXVectorA, edgeYVectorA, edgeXVectorB, edgeYVectorB, edgeLineXVectorB, edgeLineYVectorB, edgeXVectorA2, edgeYVectorA2, edgeXVectorB2, edgeYVectorB2, edgeLineXVectorB2, edgeLineYVectorB2, reactionX, reactionY, centerX, centerY, blockSide, space, pressedSpace]),
              sendPlayerGod: () => rawSend(1 /* Room */, 10 /* PlayerGod */, []),
              sendPlayerSmiley: (smiley) => rawSend(1 /* Room */, 9 /* PlayerSmiley */, [smiley]),
              snedPlaceBlock: (layer, x, y, id, args) => {
                const result = [layer, x, y, id];

                if (args !== undefined) {
                  args.serializeTo(result);
                }

                rawSend(1 /* Room */, 5 /* PlaceBlock */, result);
              },
              sendChat: (chatMessage) => rawSend(1 /* Room */, 3 /* Chat */, [chatMessage]),
              sendCanGod: () => rawSend(1 /* Room */, 25 /* CanGod */, []),
              sendWon: () => rawSend(1 /* Room */, 27 /* Won */, []),
              sendEffect: (effect, config) => rawSend(1 /* Room */, 31 /* Effect */, [effect, config]),
              sendZoneCreate: (type) => rawSend(1 /* Room */, 15 /* ZoneCreate */, [type]),
              sendZoneDelete: (id) => rawSend(1 /* Room */, 16 /* ZoneDelete */, [id]),
              sendZoneEdit: (id, placingZoneArea, startX, startY, width, height) =>
                rawSend(1 /* Room */, 17 /* ZoneEdit */, [id, placingZoneArea, startX, startY, width, height]),
              sendZoneEnter: (id) => rawSend(1 /* Room */, 18 /* ZoneEnter */, [id]),
              sendZoneExit: () => rawSend(1 /* Room */, 19 /* ZoneExit */, []),

              sendCoinCollected: (collected, x, y) => rawSend(1 /* Room */, 119 /* CoinCollected */, [collected, x, y]),
              sendRegisterSoundEffect: (target, id, rawBytes) => rawSend(1 /* Room */, 123 /* RegisterSoundEffect */, [target, id, rawBytes]),
              sendConfirmRegisterSoundEffect: (id) => rawSend(1 /* Room */, 122 /* ConfirmRegisterSoundEffect */, [id]),
              sendConfirmSoundEffects: (target) => rawSend(1 /* Room */, 120 /* ConfirmSoundEffects */, [target]),
              sendSetSoundEffectState: (target, id, state) => rawSend(1 /* Room */, 121 /* SetSoundEffectState */, [target, id, state]),
              
              send: (message) => rawSend(1 /* World */, message.messageType, message.serialize()),
              disconnect: () => self.lobby.sendRoomDisconnect(),
            };
            room._handle = (message) => {
              const raw = message.data;

              switch (message.type) {
                case 29 /* Notify */: {
                  if (room.onNotify) {
                    room.onNotify(room, {raw, message: raw[0]});
                  }
                } break;
                case 2 /* Pong */: {
                  if (room.onPong) {
                    room.onPong(room, {raw});
                  }
                } break;
                case 0 /* Init */: {
                  if (room.onInit) {
                    room.onInit(room, {
                      raw,
                      id: raw[0],
                      username: raw[1],
                      smiley: raw[2],
                      timeSinceCreation: raw[3],
                      playerX: raw[4],
                      playerY: raw[5],
                      roomName: raw[6],
                      roomOwnerUsername: raw[7],
                      backgroundColor: raw[8],
                      roomWidth: raw[9],
                      roomHeight: raw[10],
                    });
                  }
                } break;
                case 6 /* PlayerJoin */: {
                  if (room.onPlayerJoin) {
                    room.onPlayerJoin(room, {
                      raw,
                      id: raw[0],
                      username: raw[1],
                      smiley: raw[2],
                      timeSinceCreation: raw[3],
                      playerX: raw[4],
                      playerY: raw[5],
                      isInGodMode: raw[6],
                      hasWon: raw[7],
                      usernameColor: raw[8],
                    });
                  }
                } break;
                case 4 /* ChatOld */: {
                  if (room.onChatOld) {
                    room.onChatOld(room, {
                      raw,
                      username: raw[0],
                      chatMessage: raw[1],
                    });
                  }
                } break;
                case 10 /* PlayerGod */: {
                  if (room.onGod) {
                    room.onGod(room, {
                      raw,
                      id: raw[0],
                      isInGodMode: raw[1],
                    });
                  }
                } break;
                case 9 /* PlayerSmiley */: {
                  if (room.onPlayerSmiley) {
                    room.onPlayerSmiley(room, {
                      raw,
                      id: raw[0],
                      smiley: raw[1],
                    });
                  }
                } break;
                case 3 /* Chat */: {
                  if (room.onChat) {
                    room.onChat(room, {
                      raw,
                      id: raw[0],
                      chatMessage: raw[1],
                    });
                  }
                } break;
                case 13 /* ChatInfo */: {
                  if (room.onChatInfo) {
                    room.onChatInfo(room, {
                      raw,
                      chatInfoMessage: raw[0],
                    });
                  }
                } break;
                case 25 /* CanGod */: {
                  if (room.onCanGod) {
                    room.onCanGod(room, {
                      raw,
                      id: raw[0],
                      canActivateGodMode: raw[1],
                    });
                  }
                } break;
                case 27 /* Won */: {
                  if (room.onWon) {
                    room.onWon(room, {
                      raw,
                      id: raw[0]
                    });
                  }
                } break;
                case 15 /* ZoneCreate */: {
                  if (room.onZoneCreate) {
                    room.onZoneCreate(room, {
                      raw,
                      id: raw[0],
                      type: raw[1],
                    });
                  }
                } break;
                case 16 /* ZoneDelete */: {
                  if (room.onZoneDelete) {
                    room.onZoneDelete(room, {
                      raw,
                      id: raw[0],
                    });
                  }
                } break;
                case 17 /* ZoneEdit */: {
                  if (room.onZoneEdit) {
                    room.onZoneEdit(room, {
                      raw,
                      id: raw[0],
                      placingZoneArea: raw[1],
                      startX: raw[2],
                      startY: raw[3],
                      width: raw[4],
                    });
                  }
                } break;
                case 20 /* LimitedEdit */: {
                  if (room.onLimitedEdit) {
                    room.onLimitedEdit(room, {
                      raw,
                      canEdit: raw[0]
                    });
                  }
                } break;
                case 127 /* LoadLevel */: {
                  if (room.onLoadLevel) {
                    room.onLoadLevel(room, {raw});
                  }
                } break;
                case 119 /* CoinCollected */: {
                  if (room.onCoinCollected) {
                    room.onCoinCollected(room, {
                      raw,
                      id: raw[0],
                      collected: raw[1],
                      x: raw[2],
                      y: raw[3],
                    });
                  }
                } break;
                case 123 /* RegisterSoundEffect */: {
                  if (room.onRegisterSoundEffect) {
                    room.onRegisterSoundEffect(room, {
                      raw,
                      id: raw[0],
                      dataUri: raw[1],
                    });
                  }
                } break;
                case 122 /* ConfirmRegisterSoundEffect */: {
                  if (room.onConfirmRegisterSoundEffect) {
                    room.onConfirmRegisterSoundEffect(room, {
                      raw,
                      playerId: raw[0],
                      soundEffectId: raw[1]
                    });
                  }
                } break;
                case 120 /* ConfirmSoundEffects */: {
                  if (room.onConfirmSoundEffects) {
                    room.onConfirmSoundEffects(room, {raw});
                  }
                } break;
                case 121 /* SetSoundEffectState */: {
                  if (room.onSetSoundEffectState) {
                    room.onSetSoundEffectState(room, {
                      raw,
                      id: raw[0],
                      state: raw[1]
                    });
                  }
                } break;
                case 118 /* SetZoom */: {
                  if (room.onSetZoom) {
                    room.onSetZoom(room, {
                      raw,
                      zoomLevel: raw[0],
                    });
                  }
                } break;
                case 117 /* CanZoom */: {
                  if (room.onCanZoom) {
                    room.onCanZoom(room, {
                      raw,
                      canZoom: raw[0],
                    });
                  }
                } break;
              }
            };
            self.room = room;

            configure(room);
            resolve(room);
          }
        }
      };

      this.addOnMessage(listener);
      this.lobby.sendRoomConnect(id);
    });
  }

  onMessage(sender, message) {
    for (const listener of this._onMessages) {
      listener(sender, message);
    }
  }

  addOnMessage(listener) {
    this._onMessages.push(listener);
  }

  removeOnMessage(listener) {
    let listenerId = undefined;

    for (const key in this._onMessages) {
      if (this._onMessages[key] === listener) {
        // TODO: can i remove elements while iterating over? should investigate
        listenerId = key;
        break;
      }
    }

    if (listener !== undefined) {
      this._onMessages.splice(listenerId, 1);
      return true;
    }

    return false;
  }

  disconnect() {
    this._webSocket.close();
  }

  _rawSend(connectionScope, messageType, data) {
    this._webSocket.send(serialize(connectionScope, messageType, data));
  }
}

function serialize(scope, type, data) {
  // TODO: estime athe actual amount of data needed
  const buffer = new ArrayBuffer(4096);
  const view = new DataView(buffer);

  const setByte = (position, value) => view.setUint8(position, value);

  // TODO: support variable length scope/types (for now, this will do)
  setByte(0, scope);
  setByte(1, type);

  const indexRef = { i: 2 };

  for (const value of data) {
    switch (typeof value) {
      case 'string': {
        const utf8Bytes = EEW_utfTextEncoder.encode(value);

        setByte(indexRef.i++, 0 /* string */);
        _writeVarint(utf8Bytes.byteLength, indexRef, view);
        _writeBytes(utf8Bytes, indexRef, view);
      } break;

      case 'number': {
        if (value % 1 === 0) {

          // % 1 === 0 means it's a whole number
          if (value >= 0) {
            setByte(indexRef.i++, 1 /* positive int */);
            _writeVarint(value, indexRef, view);
          } else {
            setByte(indexRef.i++, 2 /* negative int */);

            // since value is negative, -value will make it positive
            _writeVarint(-value, indexRef, view);
          }
        } else {

          // otherwise, it's some kind of decimal
          setByte(indexRef.i++, 3 /* double */);
          view.setFloat64(indexRef.i, value, true);
          indexRef.i += 8;
        }
      } break;

      case 'boolean': {
        setByte(indexRef.i++, value ? 5 /* true */ : 4 /* false */);
      } break;

      // will probably only either be an object or some bytes
      default: {
        if (value instanceof Uint8Array) {
          setByte(indexRef.i++, 6 /* bytes */);
          _writeBytes(value, indexRef, view);
        }
        else {
          // probably a message object
          setByte(indexRef.i++, 7 /* object start */);

          for (const key in value) {
            const objectValue = value[key];

            // TODO: don't duplicate code, figure out how to save space
            switch (objectValue) {
              case 'string': {
                const utf8Bytes = EEW_utfTextEncoder.encode(value);
        
                setByte(indexRef.i++, 0 /* string */);
                _writeVarint(utf8Bytes.byteLength, indexRef, view);
                _writeBytes(utf8Bytes, indexRef, view);
              } break;
        
              case 'number': {
                if (value % 1 === 0) {
        
                  // % 1 === 0 means it's a whole number
                  if (value >= 0) {
                    setByte(indexRef.i++, 1 /* positive int */);
                    _writeVarint(value, indexRef, view);
                  } else {
                    setByte(indexRef.i++, 2 /* negative int */);
        
                    // since value is negative, -value will make it positive
                    _writeVarint(-value, indexRef, view);
                  }
                } else {
        
                  // otherwise, it's some kind of decimal
                  setByte(indexRef.i++, 3 /* double */);
                  view.setFloat64(indexRef.i, value, true);
                  indexRef.i += 8;
                }
              } break;
        
              case 'boolean': {
                setByte(indexRef.i++, value ? 5 /* true */ : 4 /* false */);
              } break;

              default: {
                if (value instanceof Uint8Array) {
                  setByte(indexRef.i++, 6 /* bytes */);
                  _writeBytes(value, indexRef, view);
                  break;
                }

                throw new Error("couldn't serialize messageObject " + JSON.stringify(value) + " at key " + key);
              }
            }

            const utf8Bytes = EEW_utfTextEncoder.encode(key);
            _writeVarint(utf8Bytes.byteLength, indexRef, view);
            _writeBytes(utf8Bytes, indexRef, view);
          }

          setByte(indexRef.i++, 8 /* object stop */);
        }
      } break;
    }
  }

  const slice = buffer.slice(0, indexRef.i);
  return slice;
}

function deserialize(/** @type {ArrayBuffer} */ buffer) {
  const binary = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const scope = binary[0];

  let indexRef = {i: 1};
  const type = _readVarint(indexRef, binary);

  let data = [];
  while (indexRef.i < binary.length) {
    switch (binary[indexRef.i++]) {
      case 0 /* string */: {
        const utf8Bytes = _getBytes(indexRef, binary);
        data.push(EEW_utf8TextDecoder.decode(utf8Bytes));
      } break;

      case 1 /* positive int */: {
        data.push(_readVarint(indexRef, binary));
      } break;

      case 2 /* negative int */: {
        data.push(-_readVarint(indexRef, binary));
      } break;

      case 3 /* double */: {
        data.push(view.getFloat64(indexRef.i, true));
        indexRef.i += 8;
      } break;

      case 4 /* false */: {
        data.push(false);
      } break;

      case 5 /* true */: {
        data.push(true);
      } break;

      case 6 /* bytes */: {
        const bytes = _getBytes(indexRef, binary);
        data.push(bytes);
      } break;

      case 7 /* object start */: {
        const messageObject = {};

        let pattern = binary[indexRef.i++];
        while (pattern != 8 /* object end */) {
          let value;

          switch (pattern) {
            case 0 /* string */: {
              const utf8Bytes = _getBytes(indexRef, binary);
              value = EEW_utf8TextDecoder.decode(utf8Bytes);
            } break;

            case 1 /* positive int */: {
              value = _readVarint(indexRef, binary);
            } break;

            case 2 /* negative int */: {
              value = -_readVarint(indexRef, binary);
            } break;

            case 3 /* double */: {
              value = view.getFloat64(indexRef.i, true);
              indexRef.i += 8;
            } break;

            case 4 /* false */: {
              value = false;
            } break;

            case 5 /* true */: {
              value = true;
            } break;

            case 6 /* bytes */: {
              value = _getBytes(indexRef, binary);
            } break;
          }

          const utf8Bytes = _getBytes(indexRef, binary);
          const key = EEW_utf8TextDecoder.decode(utf8Bytes);
          messageObject[key] = value;

          pattern = binary[indexRef.i++];
        }

        data.push(messageObject);
      } break;
    }
  }
  
  return { scope, type, data };
}

function _readVarint(indexObject, /** @type {Uint8Array} */ binary) {
  let result = 0;
  let bytesRead = 0;
  let current = 0;

  do {
    if (bytesRead === 7 * 5) {
      throw new Error("Read more than 5 bytes of a variable integer. Invalid bytes detected.");
    }
    
    current = binary[indexObject.i++];
    result |= (0b01111111 & current) << bytesRead;
    bytesRead += 7;
  }
  while (0 != (0b10000000 & current));

  return result;
}

function _writeVarint(value, indexObject, /** @type {DataView} */ binary) {
  // https://chromium.googlesource.com/chromium/src/third_party/+/master/protobuf/js/binary/encoder.js?autodive=0%2F%2F#125
  while (value > 0b01111111) {
    binary.setUint8(indexObject.i++, (value & 0b01111111) | 0b10000000);
    value = value >>> 7;
  }

  binary.setUint8(indexObject.i++, value);
}

function _writeBytes(/** @type {Uint8Array} */ bytes, indexObject, /** @type {DataView} */ binary) {
  // TODO: shouldn't there be some sort of native method?
  for (const byte of bytes) {
    binary.setUint8(indexObject.i++, byte);
  }
}

function _getBytes(indexObject, /** @type {Uint8Array} */ binary) {
  const length = _readVarint(indexObject, binary);
  return binary.slice(indexObject.i, (indexObject.i += length));
}

function _try(object, code) {
  if (object !== undefined) {
    code();
  }
}

module.exports = {
  createClient,
  EffectData,
  SignData,
  PortalData
};