import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Chrome extension içinde nispi (relative) yollarla çalışabilmesi için base: './' ekliyoruz
export default function config() {
  return defineConfig({
    base: './',
    plugins: [react(), tailwindcss()],
  })
}
