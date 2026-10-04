import { defineConfig } from 'vite'

export default defineConfig({
  base: '/oshi-video-editor/',
  build: {
    target: 'es2022',
    sourcemap: false,
    minify: false,
  },
})
