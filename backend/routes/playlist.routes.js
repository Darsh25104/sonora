import { Router } from 'express';
import {
  listMyPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../controllers/playlist.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { coverUpload, assertImageSize } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth); // every playlist route needs a logged-in user

router.get('/', listMyPlaylists);
router.post('/', coverUpload, assertImageSize, createPlaylist);
router.get('/:id', getPlaylist);
router.put('/:id', coverUpload, assertImageSize, updatePlaylist);
router.delete('/:id', deletePlaylist);
router.post('/:id/songs', addSongToPlaylist);
router.delete('/:id/songs/:songId', removeSongFromPlaylist);

export default router;
