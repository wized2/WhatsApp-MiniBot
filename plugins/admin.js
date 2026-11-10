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
    name: 'checkupdate',
    pattern: 'checkupdate',
    aliases: ['check', 'cu', 'updatecheck'],
    desc: 'Check for git updates (password)',
    category: 'owner',
    async handler(ctx) {
      const { args, reply, config } = ctx;
      if (!isOwner(ctx)) return reply('Owner only.');
      if (!checkPassword(config, args)) return needPw(reply, 'checkupdate');
      const root = path.join(__dirname, '..');
      try {
        await reply('Checking for updates…');
        // Fetch quietly; do not change working tree
        try {
          await execAsync('git fetch --depth 1 origin', { cwd: root, timeout: 90000 });
        } catch (fe) {
          // still try to compare with whatever remote-tracking refs exist
          console.warn('[checkupdate] fetch', fe.message || fe);
        }
        const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', {
          cwd: root,
          timeout: 15000,
        });
        const branch = String(branchOut || 'HEAD').trim();
        const { stdout: localOut } = await execAsync('git rev-parse HEAD', {
          cwd: root,
          timeout: 15000,
        });
        const local = String(localOut || '').trim();
        let remote = '';
        try {
          const { stdout: remoteOut } = await execAsync(
            `git rev-parse origin/${branch}`,
            { cwd: root, timeout: 15000 }
          );
          remote = String(remoteOut || '').trim();
        } catch (_) {
          try {
            const { stdout: remoteOut } = await execAsync('git rev-parse @{u}', {
              cwd: root,
              timeout: 15000,
            });
            remote = String(remoteOut || '').trim();
          } catch (e2) {
            await reply(
              `*Update check*\nBranch: \`${branch}\`\nLocal: \`${local.slice(0, 7)}\`\n` +
                'Remote tracking branch not found. Run from a git clone with `origin`.'
            );
            return;
          }
        }
        if (local === remote) {
          await reply(
            `*Up to date*\nBranch: \`${branch}\`\nCommit: \`${local.slice(0, 7)}\`\n\n` +
              'No new commits on origin.'
          );
          return;
        }
        let log = '';
        try {
          const { stdout: logOut } = await execAsync(
            `git log --oneline ${local.slice(0, 7)}..${remote.slice(0, 7)}`,
            { cwd: root, timeout: 15000 }
          );
          log = String(logOut || '').trim().slice(0, 1200);
        } catch (_) {}
        await reply(
          `*Update available*\nBranch: \`${branch}\`\n` +
            `Local:  \`${local.slice(0, 7)}\`\n` +
            `Remote: \`${remote.slice(0, 7)}\`\n` +
            (log ? `\nNew commits:\n\`\`\`\n${log}\n\`\`\`\n` : '\n') +
            `\nApply with:\n\`.update <password>\``
        );
      } catch (e) {
        await reply('Check failed:\n' + (e.message || e));
      }
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
