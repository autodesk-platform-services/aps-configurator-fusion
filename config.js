const { Scopes } = require('@aps_sdk/authentication');
require('dotenv').config();

let { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, APS_ACTIVITY, APS_SIGNED_ACTIVITY, SERVER_SESSION_SECRET, PORT } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL || !APS_ACTIVITY || !APS_SIGNED_ACTIVITY || !SERVER_SESSION_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
const INTERNAL_TOKEN_SCOPES = [Scopes.CodeAll, Scopes.DataRead, Scopes.ViewablesRead, Scopes.CodeAll];
const PUBLIC_TOKEN_SCOPES = [Scopes.ViewablesRead];
PORT = PORT || 8080;

module.exports = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    APS_ACTIVITY,
    APS_SIGNED_ACTIVITY,
    SERVER_SESSION_SECRET,
    INTERNAL_TOKEN_SCOPES,
    PUBLIC_TOKEN_SCOPES,
    PORT
};
