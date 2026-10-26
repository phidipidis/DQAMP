import { createApp, defaultPaths } from './app.js';

const { dataDir, distDir } = defaultPaths();
const port = Number(process.env.PORT) || 3000;
const app = createApp({ dataDir, distDir });

app.listen(port, '127.0.0.1', () => {
  console.log(`DQAMP is running at http://localhost:${port}`);
});
