import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from '../package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'Leaffmpeg',
  version: packageJson.version,
  description: 'Manipulador de GIFs/imagens utilizando FFmpeg.',
  permissions: [
    'offscreen',
    'storage'
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Abrir LeaFFmpeg'
  },
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  web_accessible_resources: [
    {
      resources: ['ffmpeg/*'],
      matches: ['<all_urls>']
    }
  ]
});