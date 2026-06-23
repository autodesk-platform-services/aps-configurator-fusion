const express = require('express');
const { translateVersion } = require('../services/aps.js');
const { authRefreshMiddleware } = require('../services/aps.js');
const bodyParser = require('body-parser');

let router = express.Router();

router.use(bodyParser.json());

router.use('/api/md', authRefreshMiddleware);

router.post('/api/md/translate', async function (req, res, next) {
    try {
        const result = await translateVersion(req.body.urn, req.internalOAuthToken.access_token);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
