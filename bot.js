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
let nextPosition = null;
let bounceMode = false;

const positionKeys = {
  '[hg]': 'top-left',
  '[hc]': 'top-center',
  '[hd]': 'top-right',
  '[mg]': 'middle-left',
  '[cc]': 'center',
  '[md]': 'middle-right',
  '[bg]': 'bottom-left',
  '[bc]': 'bottom-center',
  '[bd]': 'bottom-right',
};

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

  if (message.content === '!bounce') {
    bounceMode = true;
    overlays.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'bounce' }));
      }
    });
    message.react('📺');
    return;
  }

  if (message.content === '!stopbounce') {
    bounceMode = false;
    overlays.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stopbounce' }));
      }
    });
    message.react('⏹️');
    return;
  }

  if (message.content.startsWith('!pos ')) {
    const parts = message.content.split(' ');
    const x = parseInt(parts[1]);
    const y = parseInt(parts[2]);
    if (!isNaN(x) && !isNaN(y)) {
      nextPosition = { type: 'xy', x, y };
      message.react('📍');
    } else {
      message.reply('Usage : `!pos X Y` — exemple : `!pos 500 300`');
    }
    return;
  }

  if (message.attachments.size > 0) {
    let position = nextPosition || null;
    let caption = message.content || null;

    if (caption) {
      for (const [key, pos] of Object.entries(positionKeys)) {
        if (caption.toLowerCase().includes(key)) {
          position = { type: 'preset', preset: pos };
          caption = caption.replace(new RegExp(key.replace(/[\[\]]/g, '\\$&'), 'gi'), '').trim();
          break;
        }
      }
    }

    nextPosition = null;

    message.attachments.forEach(att => {
      console.log('Média reçu :', att.url);

      const isVideo = att.contentType?.startsWith('video/');
      const isAudio = att.contentType?.startsWith('audio/');

      const payload = {
        type: isVideo ? 'video' : isAudio ? 'audio' : 'image',
        url: isVideo || isAudio ? att.url : att.url + '?width=800&quality=lossless',
        author: message.member.displayName,
        avatar: `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`,
        caption: caption || null,
        position: position,
        bounce: bounceMode
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