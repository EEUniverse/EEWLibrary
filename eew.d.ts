/**
 * Typescript definitions for the Offical EEW Botting Library.
 */
declare namespace EEW {
  function createClient(auth: TokenAuthentication | UserAuthentication, configure?: ConfigureCallback<Client>, host?: string): Promise<Client>;

  type TokenAuthentication = string;

  interface UserAuthentication {
    readonly username: string;
    readonly password: string;
    readonly endpoint?: string;
  }

  type ConfigureCallback<T> = (object: T) => void;

  interface Client {
    readonly scopeless: ScopelessConnection;
    readonly lobby: LobbyConnection;
    readonly room: RoomConnection | undefined;
    addOnMessage(listener: Listener<Client, Messages.Receiveable>): void;
    removeOnMessage(listener: Listener<Client, Messages.Receiveable>): boolean;
    connectToRoom(id: RoomId, configure?: ConfigureCallback<RoomConnection>): Promise<RoomConnection>;
    disconnect(): DisconnectResult;
  }

  /**
   * Marker type for the type of sending a message. This exists just incase we might need to switch it to
   * Promise<void> or something.
   */
  type SendResult = void;
  /** Marker type for representing the result of a disconnect. */
  type DisconnectResult = void;

  /** Marker interface for serialization. This exists just incase we might need to switch it to something else. */
  type SerializeResult = any[];

  type ScopelessListener<TReceiveMessage extends Messages.RoomReceiveable> = Listener<ScopelessConnection, TReceiveMessage>;
  interface ScopelessConnection extends Connection<Messages.ScopelessSendable> {
    onSelfInfo: ScopelessListener<Messages.ScopelessOnSelfInfo>;

    /** @see EEW.Messages.ScopelessNotify */
    sendNotify(message: string): SendResult;
  }
  
  type LobbyListener<TReceiveMessage extends Messages.RoomReceiveable> = Listener<LobbyConnection, TReceiveMessage>;
  interface LobbyConnection extends Connection<Messages.LobbySendable> {
    onRoomConnect: LobbyListener<Messages.LobbyOnRoomConnect>;
    onRoomDisconnect: LobbyListener<Messages.LobbyOnRoomDisconnect>;
    onLoadRooms: LobbyListener<Messages.LobbyOnLoadRooms>;
    onLoadStats: LobbyListener<Messages.LobbyOnLoadStats>;
    
    /** @see EEW.Messages.LobbyRoomConnect */
    sendRoomConnnect(id: RoomId): SendResult;
    /** @see EEW.Messages.LobbyRoomDisconnect */
    sendRoomDisconnect(): SendResult;
    /** @see EEW.Messages.LobbyLoadRooms */
    sendLoadRooms(): SendResult;
    /** @see EEW.Messages.LobbyLoadStats */
    sendLoadStats(): SendResult;
  }

  type RoomListener<TReceiveMessage extends Messages.RoomReceiveable> = Listener<RoomConnection, TReceiveMessage>;
  interface RoomConnection extends Connection<Messages.RoomSendable> {
    onNotify: RoomListener<Messages.RoomOnNotify>;
    onPong: RoomListener<Messages.RoomOnPong>;
    onInit: RoomListener<Messages.RoomOnInit>;
    onPlayerJoin: RoomListener<Messages.RoomOnPlayerJoin>;
    onChatOld: RoomListener<Messages.RoomOnChatOld>;
    onGod: RoomListener<Messages.RoomOnGod>;
    onPlayerSmiley: RoomListener<Messages.RoomOnPlayerSmiley>;
    onChat: RoomListener<Messages.RoomOnChat>;
    onChatInfo: RoomListener<Messages.RoomOnChatInfo>;
    onCanGod: RoomListener<Messages.RoomOnCanGod>;
    onWon: RoomListener<Messages.RoomOnWon>;
    onZoneCreate: RoomListener<Messages.RoomOnZoneCreate>;
    onZoneDelete: RoomListener<Messages.RoomOnZoneDelete>;
    onZoneEdit: RoomListener<Messages.RoomOnZoneEdit>;
    onLimitedEdit: RoomListener<Messages.RoomOnLimitedEdit>;

    onLoadLevel: EEWSpecificData<RoomListener<Messages.RoomOnLoadLevel>>;
    onCoinCollected: EEWSpecificData<RoomListener<Messages.RoomOnCoinCollected>>;
    onRegisterSoundEffect: EEWSpecificData<RoomListener<Messages.RoomOnRegisterSoundEffect>>;
    onConfirmRegisterSoundEffect: EEWSpecificData<RoomListener<Messages.RoomOnConfirmRegisterSoundEffect>>;
    onConfirmSoundEffects: EEWSpecificData<RoomListener<Messages.RoomOnConfirmSoundEffects>>;
    onSetSoundEffectState: EEWSpecificData<RoomListener<Messages.RoomOnSetSoundEffectState>>;
    onSetZoom: EEWSpecificData<RoomListener<Messages.RoomOnSetZoom>>;
    onCanZoom: EEWSpecificData<RoomListener<Messages.RoomOnCanZoom>>;
    
    /** @see EEW.Messages.RoomPing */
    sendRoomPing(): SendResult;
    /** @see EEW.Messages.RoomInit */
    sendInit(timeSinceCreation?: number): SendResult;
    /** @see EEW.Messages.RoomPlayerMove */
    sendPlayerMove(t0: number, t1: number, arrowKeyX: number, arrowKeyY: number, playerDistanceX: number,
      playerDistanceY: number, playerVelocityX: number, playerVelocityY: number, playerAccelerationX: number,
      playerAccelerationY: number, playerRotation: number, edgeXVectorA: number, edgeYVectorA: number,
      edgeXVectorB: number, edgeYVectorB: number, edgeLineXVectorB: number, edgeLineYVectorB: number,
      edgeXVectorA2: number, edgeYVectorA2: number, edgeXVectorB2: number, edgeYVectorB2: number,
      edgeLineXVectorB2: number, edgeLineYVectorB2: number, reactionX: number, reactionY: number, centerX: number,
      centerY: number, blockSide: number | undefined, space: boolean, pressedSpace: number): SendResult;
    /** @see EEW.Messages.RoomPlayerGod */
    sendPlayerGod(): SendResult;
    /** @see EEW.Messages.RoomPlayerSmiley */
    sendPlayerSmiley(smiley: Smiley): SendResult;
    /** @see EEW.Messages.RoomPlaceBlock */
    sendPlaceBlock(layer: BlockLayer, x: number, y: number, id: Blocks.BlockId, args?: BlockData): SendResult;
    /** @see EEW.Messages.RoomChat */
    sendChat(chatMessage: string): SendResult;
    /** @see EEW.Messages.RoomCanGod */
    sendCanGod(): SendResult;
    /** @see EEW.Messages.RoomWon */
    sendWon(): SendResult;
    /** @see EEW.Messages.RoomEffect */
    sendEffect(effect: Effect, config: EffectConfiguration): SendResult;
    /** @see EEW.Messages.RoomZoneCreate */
    sendZoneCreate(type: ZoneType): SendResult;
    /** @see EEW.Messages.RoomZoneDelete */
    sendZoneDelete(id: ZoneId): SendResult;
    /** @see EEW.Messages.RoomZoneEdit */
    sendZoneEdit(id: ZoneId, placingZoneArea: boolean, startX: number, startY: number, width: number, height: number): SendResult;
    /** @see EEW.Messages.RoomZoneEnter */
    sendZoneEnter(id: ZoneId): SendResult;
    /** @see EEW.Messages.RoomZoneExit */
    sendZoneExit(): SendResult;
    /** @see EEW.Messages.RoomCoinCollected */
    sendCoinCollected(collected: number, x: number, y: number): SendResult;
    /** @see EEW.Messages.RoomRegisterSoundEffect */
    sendRegisterSoundEffect(target: Messages.PlayerTarget, id: SoundEffectId, rawBytes: Uint8Array): SendResult;
    /** @see EEW.Messages.RoomConfirmRegisterSoundEffect */
    sendConfirmRegisterSoundEffect(id: SoundEffectId): SendResult;
    /** @see EEW.Messages.RoomConfirmSoundEffects */
    sendConfirmSoundEffects(target: Messages.PlayerTarget): SendResult;
    /** @see EEW.Messages.RoomSetSoundEffectState */
    sendSetSoundEffectState(target: Messages.PlayerTarget, id: SoundEffectId, state: SoundEffectState): SendResult;
  }

  interface Connection<TSendMessage extends Messages.Sendable> {
    send(message: TSendMessage): SendResult;
    disconnect(): DisconnectResult;
  }

  type Listener<TSender, TReceivemessage extends Messages.Receiveable>
    = (sender: TSender, message: TReceivemessage) => Promise<void> | void;

  /** Marker interface to make explicit that some interface is specific to EEW, and not found in EEU. */
  type EEWSpecific = {};
  /** Marker interface to make explicit that some data is specific to EEW, and not found in EEU. */
  type EEWSpecificData<T> = T;
  /** Marker interface to make explicit that this message is for 'TrustedBotDeveloper's only. */
  type TrustedBotDeveloperOnly = {};
  /** Marker interface to make explicit that the message will only be received by the world owner. */
  type WorldOwnerOnly = {};
  /** Marker interface to make explicit that some value is a player id. */
  type PlayerId = number;
  /** Marker interface to make explicit that some value is a sound effect id. */
  type SoundEffectId = number;
  /** Marker interface to make explicit that some value is a room id. */
  type RoomId = string;
  /** Marker interface to make explicit that some value is a zone id. */
  type ZoneId = number;
  /** Marker interface to make explicit that this is a zoom level. It cannot be below 0.5, nor above 1.0. */
  type ZoomLevel = number;
  /** Marker interface to make explicit an effect configuration. TODO: give something more helpful than 'number' */
  type EffectConfiguration = number;
  /** Marker interface to make explicit that some value is a portal id. */
  type PortalId = number;

  namespace Messages {
    /** Marker interface to make explicit that a message is sendable */
    interface Sendable {
      readonly messageType: number;
      serialize(): SerializeResult;
    }
    
    /** Marker type to make explciit that a message is receiveable. */
    interface Receiveable {
      readonly raw: SerializeResult;
    }

    type DeserializeResult<T> =  T | undefined;

    // i would use nested namespaces, but that seems like excess complexity/verbosity
    // ======================================================================== SCOPELESS
    
    type ScopelessSendable = Sendable;
    type ScopelessReceiveable = Receiveable;

    /**
     * SelfInfo. This will contain all the player info for yourself.
     * It is received once on join.
     */
    interface ScopelessOnSelfInfo extends ScopelessReceiveable {
      readonly username: String;
      readonly maxEnergy: number;
      readonly stardust: number;
      readonly jewels: number;

      readonly ownedRooms: ScopelessOnSelfInfoRoom[];
    }

    /**
     * Metadata for a room that you own.
     */
    interface ScopelessOnSelfInfoRoom {
      readonly id: RoomId;
      readonly name: string;
      readonly plays: number;
      readonly visibility: Visibility;
    }

    // ======================================================================== LOBBY

    type LobbySendable = Sendable;
    type LobbyReceiveable = Receiveable;

    interface LobbyOnRoomConnect extends LobbyReceiveable {
      /**
       * May or may not contain the room id. If the room id is undefined, that means the server was unable to send the
       * player to the designated room.
       */
      readonly id: RoomId | undefined;
    }

    interface LobbyOnRoomDisconnect extends LobbyReceiveable {
    }

    interface LobbyOnLoadRooms extends LobbyReceiveable {
      readonly rooms: LobbyOnLoadRoomsRoom[];
    }

    interface LobbyOnLoadRoomsRoom {
      readonly id: RoomId;
      readonly playersOnline: number;

      readonly name: string;
      readonly plays: number;
    }

    interface LobbyOnLoadStats extends LobbyReceiveable {
      readonly playersOnline: number;
      readonly roomsOnline: number;
    }
    
    // ======================================================================== ROOMS

    type RoomSendable = Sendable;
    type RoomReceiveable = Receiveable;

    /**
     * Received when an administrator runs /notify <message>. This is shown up as a popup to everyone.
     */
    interface RoomOnNotify extends RoomReceiveable {
      readonly message: string;
    }

    interface RoomOnPong extends RoomReceiveable {
    }

    interface RoomOnInit extends RoomReceiveable {
      readonly id: PlayerId;
      readonly username: string;
      readonly smiley: Smiley;
      readonly timeSinceCreation: number;
      readonly playerX: number;
      readonly playerY: number;
      readonly roomName: string;
      readonly roomOwnerUsername: string;
      readonly backgroundColor: number; // TODO: use nicer data type
      readonly roomWidth: number;
      readonly roomHeight: number;

      // TODO: handle world deserialization
      // TODO: handle zone deserialization
    }

    interface RoomOnPlayerJoin extends RoomReceiveable {
      readonly id: PlayerId;
      readonly username: string;
      readonly smiley: Smiley;
      readonly timeSinceCreation: number;
      readonly playerX: number;
      readonly playerY: number;
      readonly isInGodMode: boolean;
      readonly hasWon: boolean;
      readonly usernameColor: EEWSpecificData<string>;
    }

    interface RoomOnChatOld extends RoomReceiveable {
      readonly username: string;
      readonly chatMessage: string;
    }

    interface RoomOnGod extends RoomReceiveable {
      readonly id: PlayerId;
      readonly isInGodMode: boolean;
    }

    interface RoomOnPlayerSmiley extends RoomReceiveable {
      readonly id: PlayerId;
      readonly smiley: Smiley;
    }

    interface RoomOnPlaceBlock extends RoomReceiveable {
      readonly layer: BlockLayer;
      readonly x: number;
      readonly y: number;
      readonly id: Blocks.BlockId;
      readonly args?: BlockData;
    }

    interface RoomOnChat extends RoomReceiveable {
      readonly id: PlayerId;
      readonly chatMessage: string;
    }

    interface RoomOnChatInfo extends RoomReceiveable {
      readonly chatInfoMessage: string;
    }

    interface RoomOnCanGod extends RoomReceiveable {
      readonly id: PlayerId;
      readonly canActivateGodMode: boolean;
    }

    interface RoomOnWon extends RoomReceiveable {
      readonly id: PlayerId;
    }

    interface RoomOnZoneCreate extends RoomReceiveable {
      readonly id: ZoneId;
      readonly type: ZoneType;
    }

    interface RoomOnZoneDelete extends RoomReceiveable {
      readonly id: ZoneId;
    }

    interface RoomOnZoneEdit extends RoomReceiveable {
      readonly id: ZoneId;
      readonly placingZoneArea: boolean;
      readonly startX: number;
      readonly startY: number;
      readonly width: number;
      readonly height: number;
    }

    interface RoomOnLimitedEdit extends RoomReceiveable {
      readonly canEdit: boolean;
    }

    interface RoomOnLoadLevel extends RoomReceiveable, EEWSpecific {
      // TODO: deserialize block data
      // TODO: deserilize zone data
    }

    interface RoomOnCoinCollected extends RoomReceiveable, EEWSpecific {
      readonly id: PlayerId;
      readonly collected: number;
      readonly x: number;
      readonly y: number;
    }

    interface RoomOnRegisterSoundEffect extends RoomReceiveable, EEWSpecific {
      readonly id: SoundEffectId;
      readonly dataUri: string;
    }

    interface RoomOnConfirmRegisterSoundEffect extends RoomReceiveable, EEWSpecific, WorldOwnerOnly {
      readonly playerId: PlayerId;
      readonly soundEffectId: SoundEffectId;
    }

    interface RoomOnConfirmSoundEffects extends RoomReceiveable, EEWSpecific {
    }

    interface RoomOnSetSoundEffectState extends RoomReceiveable, EEWSpecific {
      readonly id: SoundEffectId;
      readonly state: SoundEffectState;
    }

    interface RoomOnSetZoom extends RoomReceiveable, EEWSpecific {
      readonly zoomLevel: ZoomLevel;
    }

    interface RoomOnCanZoom extends RoomReceiveable, EEWSpecific {
      readonly canZoom: boolean;
    }

    // todo: better names?
    type TargetEveryone = -1;
    type PlayerTarget = PlayerId | TargetEveryone;
  }

  const enum MessageTypes {
    // https://github.com/EEUniverse/Library/blob/master/EEUniverse.Library/MessageType.cs#L13-L52
    SelfInfo = 23,

    Init = 0,
    Ping = 1,
    Pong = 2,
    Chat = 3,
    ChatOld = 4,
    PlaceBlock = 5,
    PlayerJoin = 6,
    PlayerExit = 7,
    PlayerMove = 8,
    PlayerSmiley = 9,
    PlayerGod = 10,
    CanEdit = 11,
    Meta = 12,
    ChatInfo = 13,
    PlayerAdd = 14,
    ZoneCreate = 15,
    ZoneDelete = 16,
    ZoneEdit = 17,
    ZoneEnter = 18,
    ZoneExit = 19,
    LimitedEdit = 20,
    ChatPMTo = 21,
    ChatPMFrom = 22,
    Clear = 24,
    CanGod = 25,
    BgColor = 26,
    Won = 27,
    Reset = 28,
    Notify = 29,
    Teleport = 30,
    Effect = 31,

    RoomConnect = 0,
    RoomDisconnect = 1,
    LoadRooms = 2,
    LoadStats = 3,

    LoadLevel = 127,
    RegisterSoundEffect = 123,
    ConfirmRegisterSoundEffect = 122,
    SetSoundEffectState = 121,
    ConfirmSoundEffects = 120,
    CoinCollected = 119,
    SetZoom = 118,
    CanZoom = 117,
  }

  const enum ConnectionScope {
    None = 0,
    Room = 1,
    Lobby = 2,
  }

  const enum Visibility {
    Public = 0,
    Unlisted = 1,
    Friends = 2,
    Private = 3,
  }

  const enum Smiley {
    Happy = 0,
    Grinning = 1,
    Meh = 2,
    Sad = 3,
    Curious = 4,
    Angry = 5,
    Joyful = 6,
    Cheeky = 7,
    Flushed = 8,
    Delirium = 9,
    HalfSkull = 10,
    Ghoul = 11,
    Samurai = 12,
    Sick = 13,
    Eyeball = 14,
    Unit = 15,
  }

  const enum Effect {
    Clear = 0,
    MultiJump = 1,
    HighJump = 2,
  }

  const enum ZoneType {
    Edit = 0,
    Vision = 1,
  }

  const enum SoundEffectState {
    Stop = 0,
    Start = 1,
    Pause = 2,
  }

  // block stuff

  const enum BlockLayer {
    Foreground = 0,
    Background = 1,
  }

  // TODO: are these the right values?
  const enum Rotation {
    Down = 0,
    Left = 1,
    Up = 2,
    Right = 3,
  }

  const enum SignRotation {
    ConnectedToNothing = 0,
    ConnectedToBottom = 1,
    ConnectedToTop = 2,
    ConnectedToLeft = 3,
    ConnectedToRight = 4,
  }

  namespace Blocks
  {
    // TODO: auto gen this code
    type BlockId = BlockIdEmpty | Foreground.Id | Background.Id;
    type BlockIdEmpty = 0;

    namespace Foreground
    {
      type Id =
        | Gravity
        | Basic
        | Stone
        | Beveled
        | Metal
        | Glass
        | Tiles
        | Special
        | Signs
        | Coins
        | Control
        | Effects
        | Brick
        | ArenaWall
        | BloodyPack
        | Hazards;

      const enum Gravity {
        Left = 13,
        Up = 14,
        Right = 15,
        None = 16,
        Slow = 71,
      }

      const enum Basic {
        White = 1,
        Grey = 2,
        Black = 3,
        Red = 4,
        Orange = 5,
        Yellow = 6,
        Green = 7,
        Cyan = 8,
        Blue = 9,
        Purple = 10,
      }

      const enum Stone {
        White = 18,
        Grey = 19,
        Black = 20,
        Red = 21,
        Orange = 22,
        Yellow = 23,
        Green = 24,
        Cyan = 25,
        Blue = 26,
        Purple = 27,
      }

      const enum Beveled {
        White = 28,
        Grey = 29,
        Black = 30,
        Red = 31,
        Orange = 32,
        Yellow = 33,
        Green = 34,
        Cyan = 35,
        Blue = 36,
        Purple = 37,
      }

      const enum Metal {
        Silver = 38,
        Steel = 39,
        Iron = 40,
        Gold = 41,
        Bronze = 42,
        Copper = 43,
      }

      const enum Glass {
        White = 45,
        Black = 46,
        Red = 47,
        Orange = 48,
        Yellow = 49,
        Green = 50,
        Cyan = 51,
        Blue = 52,
        Purple = 53,
        Pink = 54,
      }

      const enum Tiles {
        White = 72,
        Grey = 73,
        Black = 74,
        Red = 75,
        Orange = 76,
        Yellow = 77,
        Green = 78,
        Cyan = 79,
        Blue = 80,
        Purple = 81,
      }

      const enum Special {
        Black = 12,
        Secret = 95,
        Clear = 96,
        FaceHappy = 97,
        FaceSad = 98,
      }

      const enum Signs {
        Wood = 55,
        Red = 56,
        Green = 57,
        Blue = 58,
      }

      const enum Coins {
        Coin = 11,
      }

      const enum Control {
        Spawn = 44,
        Godmode = 17,
        Crown = 70,
        Portal = 59,
      }

      const enum Effects {
        Global = 92,
        MultiJump = 93,
        HighJump = 94,
      }

      const enum Brick {
        White = 99,
        Black = 100,
        Red = 101,
        Orange = 102,
        Yellow = 103,
        Green = 104,
        Cyan = 105,
        Blue = 106,
        Purple = 107,
      }

      const enum ArenaWall {
        White = 108,
        Black = 109,
        Red = 110,
        Orange = 111,
        Yellow = 112,
        Green = 113,
        Cyan = 114,
        Blue = 115,
        Purple = 116,
      }

      const enum BloodyPack {
        Intestine = 117,
        FreshBloodBlock = 118,
        DriedBloodBlock = 119,
        DriedBloodFloor = 120,
        DriedBloodCornerRight = 121,
        DriedBloodCornerLeft = 122,
        BloodSplattersA = 123,
        BloodSplattersB = 124,
        BloodSplattersC = 125,
        BloodSplattersD = 126,
        BloodSplattersE = 127,
        BloodSplattersF = 128,
        BloodSplattersG = 129,
        BloodSplattersH = 130,
        BloodSplattersI = 131,
        BloodSplattersJ = 132,
        BloodSplattersK = 133,
        BubbleBlood = 134,
        BubbleBloodSmall = 135,
        BloodTop = 136,
        BloodRoof = 137,
        BloodLiquid = 138,
        BloodDropletAir = 139,
        BloodCascade = 140,
      }

      const enum Hazards {
        SawBlade = 141,
      }
    }

    namespace Background
    {
      type Id =
        | Basic
        | Tiles;
      
      const enum Basic {
        White = 60,
        Grey = 61,
        Black = 62,
        Red = 63,
        Orange = 64,
        Yellow = 65,
        Green = 66,
        Cyan = 67,
        Blue = 68,
        Purple = 69,
      }

      const enum Tiles {
        White = 82,
        Grey = 83,
        Black = 84,
        Red = 85,
        Orange = 86,
        Yellow = 87,
        Green = 88,
        Cyan = 89,
        Blue = 90,
        Purple = 91,
      }
    }
  }

  type BlockData =
    | EffectData
    | SignData
    | PortalData;

  class EffectData {
    constructor(effectData: number);
    readonly effectData: number;
  }

  class SignData {
    constructor(text: string, rotation: SignRotation);
    readonly text: string;
    readonly rotation: SignRotation;
  }

  class PortalData {
    constructor(rotation: Rotation, id: PortalId, target: PortalId, flipped: boolean);
    readonly rotation: Rotation;
    readonly id: PortalId;
    readonly target: PortalId;
    readonly flipped: boolean;
  }
}

export default EEW;