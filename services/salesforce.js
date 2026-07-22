import axios from 'axios';

const TOKEN_URL = 'https://login.salesforce.com/services/oauth2/token';
const API_VERSION = 'v59.0';

/**
 * DM login using Salesforce's username-password OAuth flow, so each DM
 * authenticates with their own Salesforce credentials rather than a
 * separate credentials table. Requires the Connected App to have the
 * "Support the OAuth Username-Password Flows" policy enabled and the DM's
 * password to be their SF password + security token appended (Salesforce
 * convention when not calling from a trusted/whitelisted IP range).
 */
export async function loginWithPassword({ username, password }) {
  const { data } = await axios.post(TOKEN_URL, null, {
    params: {
      grant_type: 'password',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      username,
      password,
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  // data.id looks like https://login.salesforce.com/id/<orgId>/<userId>
  const userId = data.id ? data.id.split('/').pop() : null;
  return { accessToken: data.access_token, instanceUrl: data.instance_url, userId };
}

export async function soqlQuery({ accessToken, instanceUrl, soql }) {
  const { data } = await axios.get(`${instanceUrl}/services/data/${API_VERSION}/query`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { q: soql },
  });
  return data.records;
}

export async function updateRecord({ accessToken, instanceUrl, objectName, id, fields }) {
  await axios.patch(
    `${instanceUrl}/services/data/${API_VERSION}/sobjects/${objectName}/${id}`,
    fields,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
  );
}

/** Escapes a value for safe use inside a SOQL string literal. */
export function soqlEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
