const keepAlive = require(`./server`);
const express = require ('express')
const app = express();
const port = 3000
const { Client, Enums } = require('fnbr');
const { readFile, writeFile } = require('fs').promises;
const { get } = require('request-promise');
const axios = require("axios");
const WebSocketClient = require('websocket').client;


function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}



(async () => {
  const currentLibVersion = JSON.parse(await readFile(require.resolve('fnbr').replace('index.js', 'package.json'))).version;
  const latestVersion = (await get({ url: 'https://registry.npmjs.org/-/package/fnbr/dist-tags', json: true })).latest;
  if (currentLibVersion !== latestVersion) console.log('\x1b[31mWARNING: You\'re using an older version of the library. Please run installDependencies.bat\x1b[0m');
  let config;
  try {
    config = JSON.parse(await readFile('./config.json'));
  } catch (e) {
    await writeFile('./config.json', JSON.stringify({
      outfit: 'Renegade Raider',
      backpack: 'Black Shield',
      emote: 'The Renegade',
      pickaxe: 'AC/DC',
      banner: 'InfluencerBanner57',
      bannerColor: 'defaultcolor',
      level: 999,
      status: 'Frostnite BR💙',
      friendaccept: true,
      inviteaccept: true,
      platform: 'WIN',
    }, null, 2));
    console.log('\x1b[31mWARNING: config.json was missing and created. Please fill it out\x1b[0m');
    return;
  }

  console.log('\x1b[36mfortnitejs-bot made by xMistt. Massive credit to This Nils and Alex for creating the library.');
  console.log('Discord server: https://discord.gg/fnpy - For support, questions, etc.\x1b[0m');

  process.stdout.write('\x1b[33mFetching cosmetics...\x1b[0m');
  let cosmetics;
  try {
    cosmetics = (await get({ url: 'https://fortnite-api.com/v2/cosmetics/br', json: true })).data;
  } catch (e) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log('\x1b[31mFailed fetching cosmetics!\x1b[0m');
    return;
  }
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log('\x1b[32mSuccessfully fetched cosmetics!\x1b[0m');

  const defaultCosmetics = {
    outfit: cosmetics.find((c) => c.name === config.outfit && c.type.value === 'outfit'),
    backpack: cosmetics.find((c) => c.name === config.backpack && c.type.value === 'backpack'),
    pickaxe: cosmetics.find((c) => c.name === config.pickaxe && c.type.value === 'pickaxe'),
    emote: cosmetics.find((c) => c.name === config.emote && c.type.value === 'emote'),
  };

  for (const key of Object.keys(defaultCosmetics)) {
    if (!defaultCosmetics[key]) {
      console.log(`\x1b[31mWARNING: ${key} in config wasn't found! Please check the spelling\x1b[0m`);
      return;
    }
  }

  const clientOptions = {
    status: config.status,
    platform: config.platform,
    cachePresences: false,
    kairos: {
      cid: defaultCosmetics.outfit.id,
      color: Enums.KairosColor.GRAY,
    },
    keepAliveInterval: 30,
    auth: {},
    debug: false,
  };

  try {
    clientOptions.auth.deviceAuth = JSON.parse(await readFile('./deviceAuth.json'));
  } catch (e) {
    clientOptions.auth.authorizationCode = async () => Client.consoleQuestion('Please enter an authorization code: ');
  }

  const client = new Client(clientOptions);
  client.on('deviceauth:created', (da) => writeFile('./deviceAuth.json', JSON.stringify(da, null, 2)));
  process.stdout.write('\x1b[33mBot starting...\x1b[0m');
  await client.login();
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`\x1b[32mBot started as ${client.user.displayName}!\x1b[0m`);
  await client.party.me.setOutfit(defaultCosmetics.outfit.id);
  await client.party.me.setBackpack(defaultCosmetics.backpack.id);
  await client.party.me.setPickaxe(defaultCosmetics.pickaxe.id);
  await client.party.me.setLevel(config.level);
  await client.party.me.setBanner(config.banner, config.bannerColor);

  var WSClient = new WebSocketClient();
  let latest_payload = {};

  WSClient.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
  });

  WSClient.on('connect', function(connection) {
    console.log('Connected to Matchmaking!');
    connection.on('error', function(error) {
      console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
      console.log('WS Connection Closed!');
      if (latest_payload.payload.sessionId) {
        const session_id = latest_payload.payload.sessionId;
        console.log("Session ID: " + session_id)
        const url = `https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/matchmaking/session/${session_id}`
        axios.get(url, {
          headers: { "User-Agent": "Fortnite/++Fortnite+Release-21.20-CL-20788829 Windows/10", "Authorization": "Bearer " + client.Auth.auths.token }
        })
          .then(function(response) {
            const session_data = response.data;
            console.log("Session Data Received: " + JSON.stringify(session_data));
            console.log("Updating XMPP Presence...")
            console.log(session_data['id'])
            client.setStatus({
              "Status": "💎Join now!💎",
              "bIsPlaying": true,
              "bIsJoinable": true,
              "bHasVoiceSupport": true,
              "SessionId": session_data['id'],
              "ProductName": "Fortnite",
              "Properties": {
                "party.joininfodata.286331153_j": {
                  "sourceId": "",
                  "sourceDisplayName": client.user.name,
                  "sourcePlatform": "IOS",
                  "partyId": client.party.id,
                  "partyTypeId": 286331153,
                  "key": "",
                  "appId": "Fortnite",
                  "buildId": "13920814",
                  "partyFlags": 286331158,
                  "notAcceptingReason": 0,
                  "pc": 1
                },
                "FortBasicInfo_j": {
                  "homeBaseRating": 130
                },
                "FortLFG_I": "0",
                "FortPartySize_i": 1,
                "FortSubGame_i": 1,
                "InUnjoinableMatch_b": false,
                "FortGameplayStats_j": {
                  "state": "",
                  "playlist": "playlist_battlelab",
                  "numKills": 7,
                  "bFellToDeath": false
                },
                "SocialStatus_j": {
                  "attendingSocialEventIds": []
                },
                "GamePlaylistName_s": "playlist_battlelab",
                "Event_PlayersAlive_s": "1",
                "Event_PartySize_s": "1",
                "Event_PartyMaxSize_s": "16",
                "GameSessionJoinKey_s": session_data['attributes']['SESSIONKEY_s'],
                "ServerPlayerCount_i": 1
              }
            }
            )
            console.log("XMPP Presence updated! You can join now.")
            //client.party.setPrivacy(Enums.PartyPrivacy.PUBLIC);
          })
          .catch(function(error) {
            console.log(error);
          })
      }
      else {
        console.log("Error: Couldn't get session id!")
      }
    });
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        console.log("Received: '" + message.utf8Data + "'");
        latest_payload = JSON.parse(message.utf8Data);
        if (latest_payload.payload.queuedPlayers) {
          connection.send(JSON.stringify({ "name": "Exec", "payload": { "command": "p.StartMatch" } }))
        }
      }
    })
  });


  client.on('friend:request', (req) => {
    if (config.friendaccept) req.accept();
    else req.decline();
    console.log(`${config.friendaccept ? 'accepted' : 'declined'} friend request from: ${req.displayName}`);
  });

  client.on('party:invite', (inv) => {
    if (config.inviteaccept) inv.accept();
    else inv.decline();
    console.log(`${config.inviteaccept ? 'accepted' : 'declined'} party invite from: ${inv.sender.displayName}`);
  });

  client.on('party:member:joined', () => {
    client.party.me.setEmote(defaultCosmetics.emote.id);
  });

  const findCosmetic = (query, type) => {
    return cosmetics.find((c) => (c.id.toLowerCase() === query.toLowerCase()
      || c.name.toLowerCase() === query.toLowerCase()) && c.type.value === type);
  };

  const handleCommand = (message, sender) => {
    console.log(`${sender.displayName}: ${message.content}`);
    if (!message.content.startsWith('m')) return;

    const args = message.content.slice(1).split(' ');
    const command = args.shift().toLowerCase();
    const content = args.join(' ');

    if (command === 'skin') {
      const skin = findCosmetic(content, 'outfit');
      if (skin) client.party.me.setOutfit(skin.id);
      else message.reply(`Skin ${content} wasn't found!`);
    } else if (command === 'emote') {
      const emote = findCosmetic(content, 'emote');
      if (emote) client.party.me.setEmote(emote.id);
      else message.reply(`Emote ${content} wasn't found!`);
    } else if (command === 'pickaxe') {
      const pickaxe = findCosmetic(content, 'pickaxe');
      if (pickaxe) client.party.me.setPickaxe(pickaxe.id);
      else message.reply(`Pickaxe ${content} wasn't found!`);
    } else if (command === 'ready') {
      client.party.me.setReadiness(true);
    } else if (command === 'unready') {
      client.party.me.setReadiness(false);
    } else if (command === 'purpleskull') {
      client.party.me.setOutfit('CID_030_Athena_Commando_M_Halloween', [{ channel: 'ClothingColor', variant: 'Mat1' }]);
    } else if (command === 'pinkghoul') {
      client.party.me.setOutfit('CID_029_Athena_Commando_F_Halloween', [{ channel: 'Material', variant: 'Mat3' }]);
    } else if (command === 'level') {
      client.party.me.setLevel(parseInt(content, 10));
    } else if (command === 'm') {
      console.log("Generating matchmaking ticket...")
      message.reply("Generating BR Island ticket...t...")
      const customkey = makeid(5);
      const url = `https://fortnite-public-service-prod11.ol.epicgames.com/fortnite/api/game/v2/matchmakingservice/ticket/player/${client.user.id}?partyPlayerIds=${client.party.members.map(m => m.id).join(",")}&bucketId=21196749:1:NAE:PLAYLIST_PLAYGROUNDV2&player.platform=ANDROID&player.subregions=SAO&player.option.preserveSquad=false&player.option.crossplayOptOut=false&player.option.partyId=${client.party.id}&player.option.splitScreen=false&party.WIN=true&input.KBM=true&player.input=KBM&player.option.microphoneEnabled=true&player.option.linkCode=playlist_playgroundv2&player.option.creative.islandCode=playlist_playgroundv2&player.option.uiLanguage=en`
      axios.get(url, {
        headers: { "User-Agent": "Fortnite/++Fortnite+Release-21.50-CL-215577619 Windows/10", "Authorization": "Bearer " + client.Auth.auths.token }
      })
        .then(function(response) {
          console.log("Successfully generated an matchmaking ticket!")
          message.reply("Successfully generated an BR Island ticket!")
          const ticket_payload = response.data.payload
          const ticket_signature = response.data.signature
          const ticket_type = response.data.ticketType
          const websocket_url = response.data.serviceUrl

          console.log("Generating checksum...")
          message.reply("Generating checksum...")
          axios.post('https://plebs.polynite.net/api/checksum', {
            "payload": ticket_payload,
            "signature": ticket_signature
          })
            .then(function(response) {
              const checksum = response.data.checksum
              console.log("Successfully generated checksum!: " + checksum)
              message.reply("Successfully generated checksum!: " + checksum)
              console.log("Connecting to matchmaking WebSocket...")
              message.reply("Connecting to BR websocket...")
              message.reply("Connected to BR websocket!")
               message.reply("Bucket ID:21196749")
              message.reply("Version ID:Fortnite+Release-21.50-CL-215577619")

              var extraHeaders = {
                'Authorization': `Epic-Signed ${ticket_type} ${ticket_payload} ${ticket_signature} ${checksum}`
              }

              WSClient.connect(websocket_url, null, null, extraHeaders)
            })
            .catch(function(error) {
              console.log(error);
            });
        })
        .catch(function(error) {
          console.log(error);
        })
    }
  };

  client.on('friend:message', (m) => handleCommand(m, m.author));
  client.on('party:member:message', (m) => handleCommand(m, m.author));
})();
keepAlive();
