const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');

require('dotenv').config();
const TOKEN = process.env.TOKEN;
const WS_PASSWORD = 'GlitchOverlay2026!';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const wss = new WebSocket.Server({ port: 8080 });
let overlays = [];

wss.on('connection', ws => {
  let authenticated = false;

  ws.on('message', msg => {
    if (!authenticated) {
      if (msg.toString() === WS_PASSWORD) {
        authenticated = true;
        overlays.push(ws);
        console.log('Overlay authentifié');
      } else {
        console.log('Mot de passe incorrect, connexion refusée');
        ws.close();
      }
      return;
    }
  });

  ws.on('close', () => {
    console.log('Overlay déconnecté');
    overlays = overlays.filter(o => o !== ws);
  });
});

client.on('clientReady', () => {
  console.log(`Bot connecté : ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.channel.name !== 'overlay-media') return;

  if (message.content === '!skip') {
    overlays.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'skip' }));
      }
    });
    message.react('⏭️');
    return;
  }

  if (message.content === '!clear') {
    overlays.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'clear' }));
      }
    });
    message.react('🗑️');
    return;
  }

  if (message.content === '!pause') {
    overlays.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'pause' }));
      }
    });
    message.react('⏸️');
    return;
  }

  if (message.content === '!resume') {
    overlays.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resume' }));
      }
    });
    message.react('▶️');
    return;
  }

  if (message.content === '!purge') {
    try {
      const messages = await message.channel.messages.fetch({ limit: 100 });
      await message.channel.bulkDelete(messages);
      console.log('Channel purgé');
    } catch (err) {
      console.error('Erreur purge:', err);
    }
    return;
  }

  if (message.attachments.size > 0) {
    message.attachments.forEach(att => {
      console.log('Média reçu :', att.url);

      const isVideo = att.contentType?.startsWith('video/');
      const isAudio = att.contentType?.startsWith('audio/');

      const payload = {
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        url: att.url,
        author: message.member.displayName,
        avatar: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`,
        caption: message.content || null
      };

      overlays.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      });
    });
  }
});

client.login(TOKEN)
  .then(() => console.log('Connexion réussie'))
  .catch(err => console.error('Erreur login :', err));