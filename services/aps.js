const { AuthenticationClient, ResponseType } = require('@aps_sdk/authentication');
const { DataManagementClient } = require('@aps_sdk/data-management');
const { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, APS_ACTIVITY, APS_SIGNED_ACTIVITY, INTERNAL_TOKEN_SCOPES, PUBLIC_TOKEN_SCOPES } = require('../config.js');

const authenticationClient = new AuthenticationClient();
const dataManagementClient = new DataManagementClient();
const service = module.exports = {};

const fs = require('fs');
const uuid = require('uuid');

service.getAuthorizationUrl = () => authenticationClient.authorize(APS_CLIENT_ID, ResponseType.Code, APS_CALLBACK_URL, INTERNAL_TOKEN_SCOPES);

service.authCallbackMiddleware = async (req, res, next) => {
    const internalCredentials = await authenticationClient.getThreeLeggedToken(APS_CLIENT_ID, req.query.code, APS_CALLBACK_URL, {
        clientSecret: APS_CLIENT_SECRET
    });
    const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
        clientSecret: APS_CLIENT_SECRET,
        scopes: PUBLIC_TOKEN_SCOPES
    });
    req.session.public_token = publicCredentials.access_token;
    req.session.internal_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    next();
};

service.authRefreshMiddleware = async (req, res, next) => {
    const { refresh_token, expires_at } = req.session;
    if (!refresh_token) {
        res.status(401).end();
        return;
    }

    if (expires_at < Date.now()) {
        try {
            const internalCredentials = await authenticationClient.refreshToken(refresh_token, APS_CLIENT_ID, {
                clientSecret: APS_CLIENT_SECRET,
                scopes: INTERNAL_TOKEN_SCOPES
            });
            const publicCredentials = await authenticationClient.refreshToken(internalCredentials.refresh_token, APS_CLIENT_ID, {
                clientSecret: APS_CLIENT_SECRET,
                scopes: PUBLIC_TOKEN_SCOPES
            });
            req.session.public_token = publicCredentials.access_token;
            req.session.internal_token = internalCredentials.access_token;
            req.session.refresh_token = publicCredentials.refresh_token;
            req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
        } catch (err) {
            console.error('Error refreshing token:', err);
            req.session.public_token = null;
            req.session.internal_token = null;
            req.session.refresh_token = null;
            req.session.expires_at = null;
            res.status(401).end();
            return;
        }
    }
    req.internalOAuthToken = {
        access_token: req.session.internal_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
    };
    req.publicOAuthToken = {
        access_token: req.session.public_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
    };
    next();
};

service.getUserProfile = async (accessToken) => {
    const resp = await authenticationClient.getUserInfo(accessToken);
    return resp;
};

service.getHubs = async (accessToken) => {
    const resp = await dataManagementClient.getHubs({ accessToken });
    return resp.data;
};

service.getProjects = async (hubId, accessToken) => {
    const resp = await dataManagementClient.getHubProjects(hubId, { accessToken });
    return resp.data;
};

service.getProjectContents = async (hubId, projectId, folderId, accessToken) => {
    if (!folderId) {
        const resp = await dataManagementClient.getProjectTopFolders(hubId, projectId, { accessToken });
        return resp.data;
    } else {
        const resp = await dataManagementClient.getFolderContents(projectId, folderId, { accessToken });
        return resp.data;
    }
};

service.getItemVersions = async (projectId, itemId, accessToken) => {
    const resp = await dataManagementClient.getItemVersions(projectId, itemId, { accessToken });
    return resp.data;
};

service.runWorkItem = async (hubId, fileItemId, params, pat, accessToken) => {
    //const token = await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, INTERNAL_TOKEN_SCOPES);

    let taskParams = {
        fileURN: fileItemId,
        hubId: hubId,
        fileSuffix: uuid.v4(),
        parameters: params,
    }

    console.log(JSON.stringify(taskParams, null, 2));

    const script = fs.readFileSync('services/da-script-setparams.ts', 'utf8');

    const body = JSON.stringify({
        activityId: APS_ACTIVITY,
        signatures: {
            activityId: APS_SIGNED_ACTIVITY,
        },
        arguments: {
            "PersonalAccessToken": pat,
            "TaskParameters": JSON.stringify(taskParams),
            "TaskScript": script
        }
    });
    console.log(body);

    const resp = await fetch('https://developer.api.autodesk.com/da/us-east/v3/workitems', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body 
    });

    const workItem = await resp.json();

    console.log(workItem);

    return workItem;
}

service.getWorkItemStatus = async (workItemId, accessToken) => {
    //const token = await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, INTERNAL_TOKEN_SCOPES);

    const resp = await fetch(`https://developer.api.autodesk.com/da/us-east/v3/workitems/${workItemId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const workItem = await resp.json();

    console.log(workItem);

    return workItem;
}

service.getVersionUrn = async (projectId, folderId, fileName, accessToken) => {
    let pageNumber = null;
    
    while (true) {
        const files = await dataManagementClient.getFolderContents(projectId, folderId, {
            accessToken,
            pageNumber,
        });

        for (let file of files.data) {
            if (file.attributes.displayName === fileName) {
                return file.relationships.tip.data.id;
            }
        } 
        
        if (!files.links.next)
            return null;

        pageNumber = new URL(files.links.next.href).searchParams.get('page[number]');
    }
}

service.getVersionUrnSearch = async (projectId, folderId, fileName, accessToken) => {
    const files = await dataManagementClient.getFolderSearch(projectId, folderId, {
        filterFieldName: 'displayName',
        filterValue: [fileName],
        accessToken
    });

    console.log(files);

    if (files.data.length > 0) {
        return files.data[0].id;
    }
}
