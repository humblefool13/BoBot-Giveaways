const { Client, Collection, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();
const CryptoJS = require('crypto-js');

function encrypt(message) {
  const cipherCode = CryptoJS.AES.encrypt(message, process.env['secretPhrase']);
  return cipherCode.toString();
}
function decrypt(encryptedString) {
  const cipherText = CryptoJS.AES.decrypt(
    encryptedString,
    process.env['secretPhrase']
  );
  const plainText = cipherText.toString(CryptoJS.enc.Utf8);
  return plainText;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.interactions = new Collection();

require('./handlers/events')(client);
require('./handlers/interactions')(client);

require('./databases/rafflesDB')();

process.on('unhandledRejection', (reason, p) => {
  console.log('[ ANTICRASH ] :: Unhandled Rejection / Catch');
  console.log(reason?.stack, p);
});
process.on('uncaughtException', (err, origin) => {
  console.log('[ ANTICRASH ] :: Uncaught Exception / Catch');
  console.log(err?.stack, origin);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.log('[ ANTICRASH ] :: Uncaught Exception / Catch { MONITOR }');
  console.log(err?.stack, origin);
});

const twitter_db = require('./models/twitter');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));
app.use(require('body-parser').json());
app.get('/discord', (req, res) => {
  res.render('discord');
});
app.get('/twitter', (req, res) => {
  res.render('twitter');
});
app.post('/post', async (req, res) => {
  const discordCode = req.body.discordCode;
  const twitterCode = req.body.twitterCode;
  const responseTwitter = await fetch(
    `https://api.twitter.com/2/oauth2/token?code=${twitterCode}&grant_type=authorization_code&client_id=c0NySEZpU19vSWY4bFJYMndLMGg6MTpjaQ&redirect_uri=https://giveaway.fslabs.xyz/twitter&code_verifier=challenge`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${process.env['auth_token'].replaceAll(`"`, '')}`,
      },
      method: 'POST',
    }
  );
  const resultTwitter = await responseTwitter.json();
  const data = new URLSearchParams({
    client_id: '1001909973938348042',
    client_secret: process.env['client_discord_secret'],
    grant_type: 'authorization_code',
    code: discordCode,
    redirect_uri: 'https://giveaway.fslabs.xyz/discord',
  });
  const responseDiscord = await fetch(`https://discord.com/api/oauth2/token`, {
    method: 'POST',
    body: data.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  const resultDiscord = await responseDiscord.json();
  const discordAccessToken = resultDiscord.access_token;
  const twitterAccessToken = resultTwitter.access_token;
  const discordRefreshToken = resultDiscord.refresh_token;
  const twitterRefreshToken = resultTwitter.refresh_token;
  const twitterUserInfoResponse = await fetch(
    'https://api.twitter.com/2/users/me',
    {
      headers: {
        Authorization: `Bearer ${twitterAccessToken}`,
      },
    }
  );
  const twitterUserInfoResult = await twitterUserInfoResponse.json();
  const twitterId = twitterUserInfoResult.data.id;
  const twitterUsername = twitterUserInfoResult.data.username;
  const discordUserInfoResponse = await fetch(
    'https://discord.com/api/users/@me',
    {
      headers: {
        Authorization: `Bearer ${discordAccessToken}`,
      },
    }
  );
  const discordUserInfoResult = await discordUserInfoResponse.json();
  const discordId = discordUserInfoResult.id;
  const discordUsername = discordUserInfoResult.username;
  const discordDiscriminator = discordUserInfoResult.discriminator;
  const find = await twitter_db.findOne({
    twitter_id: twitterId,
  });
  if (!find) {
    await new twitter_db({
      twitter_id: twitterId,
      discord_id: discordId,
      twitter_username: '@' + twitterUsername,
      discord_username: discordUsername + '#' + discordDiscriminator,
      access_token_twitter: encrypt(twitterAccessToken),
      access_token_discord: encrypt(discordAccessToken),
      refresh_token_discord: encrypt(discordRefreshToken),
      refresh_token_twitter: encrypt(twitterRefreshToken),
    })
      .save()
      .catch((e) => console.log(e));
  } else {
    await twitter_db
      .deleteOne({
        twitter_id: twitterId,
      })
      .then(async () => {
        await new twitter_db({
          twitter_id: twitterId,
          discord_id: discordId,
          twitter_username: '@' + twitterUsername,
          discord_username: discordUsername + '#' + discordDiscriminator,
          access_token_twitter: encrypt(twitterAccessToken),
          access_token_discord: encrypt(discordAccessToken),
          refresh_token_discord: encrypt(discordRefreshToken),
          refresh_token_twitter: encrypt(twitterRefreshToken),
        })
          .save()
          .catch((e) => console.log(e));
      });
  }
  res.sendStatus(200);
});
app.get('/style.css', function (req, res) {
  res.sendFile('/home/bo/projects/BoBot-Giveaways/views/style.css');
});
app.listen(3000, () => {});

client.login(process.env['bot_token']);
