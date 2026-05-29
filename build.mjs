import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/AddonAPIKit.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/AddonAPIKit.js',
  external: ['@minecraft/server'],
  banner: {
    js: [
      '/** @license MIT',
      ' * AddonAPIKit - Copyright (c) 2026 ForestOfLight',
      ' * MCBE-IPC - Copyright (c) 2026 OmniacDev',
      ' * See LICENSE for details.',
      ' */',
    ].join('\n'),
  },
});
