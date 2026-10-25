const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { isOwner } = require('../lib/owner');
const { loadPlugins } = require('../lib/pluginLoader');
const channelPoll = require('../lib/channelPoll');
const path = require('path');

function checkPassword(config, args) {
  const expected = String(config.adminPassword || process.env.ADMIN_PASSWORD || '0980');
  const given = String(args[0] || '').trim();
  return given && given === expected;
}

function needPw(reply, cmd) {
  return reply(`Password required.\nUsage: \`.${cmd} <password>\``);
}

module.exports = [
  {
    name: 'restart',
    pattern: 'restart',
    aliases: ['reboot'],
    desc: 'Restart bot process (password)',
    category: 'owner',
    async handler(ctx) {
      const { args, reply, config } = ctx;
      if (!isOwner(ctx)) return reply('Owner only.');
      if (!checkPassword(config, args)) return needPw(reply, 'restart');
      await reply('Restarting…');
      setTimeout(() => process.exit(0), 400);
    },
  },
  {
    name: 'update',
    pattern: 'update',
    aliases: ['upgrade', 'pull'],
    desc: 'git pull then restart (password)',
    category: 'owner',
    async handler(ctx) {
      const { args, reply, config } = ctx;
      if (!isOwner(ctx)) return reply('Owner only.');
      if (!checkPassword(config, args)) return needPw(reply, 'update');
      await reply('Updating from git…');
      const root = path.join(__dirname, '..');
      try {
        const { stdout, stderr } = await execAsync('git pull --ff-only', {
          cwd: root,
          timeout: 120000,
        });
        await reply(`*git pull*\n\`\`\`\n${String(stdout || stderr || 'ok').slice(0, 1500)}\n\`\`\`\nRestarting…`);
      } catch (e) {
        await reply(`Update failed:\n${e.message}\nStill restarting so supervisor can recover.`);
      }
      setTimeout(() => process.exit(0), 800);
    },
  },
  {
    name: 'refresh',
    pattern: 'refresh',
    aliases: ['reload'],
    desc: 'Reload plugins + resubscribe channels (password)',
    category: 'owner',
    async handler(ctx) {
      const { args, reply, config, sock } = ctx;
      if (!isOwner(ctx)) return reply('Owner only.');
      if (!checkPassword(config, args)) return needPw(reply, 'refresh');
      try {
        const pluginsDir = path.join(__dirname);
        // Clear require cache for plugins + lib used by cfwd
        for (const key of Object.keys(require.cache)) {
          if (key.includes(`${path.sep}plugins${path.sep}`) || key.includes(`${path.sep}lib${path.sep}channel`)) {
            delete require.cache[key];
          }
        }
        if (typeof global.reloadPlugins === 'function') {
          global.reloadPlugins('admin-refresh');
        } else {
          loadPlugins(pluginsDir);
        }
        if (channelPoll.refreshSubscriptions) channelPoll.refreshSubscriptions();
        if (sock && channelPoll.tick) await channelPoll.tick();
        await reply('Refreshed plugins, channel subscriptions, and ran a poll tick.');
      } catch (e) {
        await reply('Refresh error: ' + e.message);
      }
    },
  },
];
