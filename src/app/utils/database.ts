import { app } from 'electron';
import * as path from 'path';

export const getDatabasePath = () => {
  if (app) {
    return path.join(app.getPath('userData'), 'truchet-designs.db');
  }
  // Fallback for development
  return path.join(process.env['HOME'] || process.env['USERPROFILE'] || '.', '.truchet-designs.db');
};
