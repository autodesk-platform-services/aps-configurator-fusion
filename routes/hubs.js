const express = require('express');
const { authRefreshMiddleware, getHubs, getProjects, getProjectContents, getItemVersions, getVersionUrn } = require('../services/aps.js');

let router = express.Router();

router.use('/api/hubs', authRefreshMiddleware);

router.get('/api/hubs', async function (req, res, next) {
    try {
        const hubs = await getHubs(req.internalOAuthToken.access_token);
        res.json(hubs.map(hub => ({ id: hub.id, name: hub.attributes.name })));
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects', async function (req, res, next) {
    try {
        const projects = await getProjects(req.params.hub_id, req.internalOAuthToken.access_token);
        res.json(projects.map(project => ({ id: project.id, name: project.attributes.name })));
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects/:project_id/contents', async function (req, res, next) {
    try {
        const entries = await getProjectContents(req.params.hub_id, req.params.project_id, req.query.folder_id, req.internalOAuthToken.access_token);
        res.json(entries.map(entry => ({ id: entry.id, name: entry.attributes.displayName, folder: entry.type === 'folders' })));
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects/:project_id/contents/:item_id/versions', async function (req, res, next) {
    try {
        const versions = await getItemVersions(req.params.project_id, req.params.item_id, req.internalOAuthToken.access_token);
        res.json(versions.map(version => ({ id: version.id, name: version.attributes.createTime })));
    } catch (err) {
        next(err);
    }
});

router.get('/api/hubs/:hub_id/projects/:project_id/folders/:folder_id/files/:file_name', async function (req, res, next) {
    try {
        const versionUrn = await getVersionUrn(req.params.project_id, req.params.folder_id, req.params.file_name, req.internalOAuthToken.access_token);
        res.json(versionUrn);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
