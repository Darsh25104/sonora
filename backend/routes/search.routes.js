import { Router } from 'express';
import { search } from '../controllers/search.controller.js';

const router = Router();

router.get('/', search); // GET /api/search?q=believer

export default router;
