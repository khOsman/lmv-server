import axios from 'axios';

const API_VERSION = 'v59.0';

/**
 * DM login happens on-device via the native Authorization Code + PKCE flow
 * (see the Flutter app's AuthService) - the DM's credentials are entered on
 * Salesforce's own hosted login page and never reach this backend. The app
 * hands us the resulting { accessToken, instanceUrl } and we validate it
 * here by calling Salesforce's own userinfo endpoint: if the token isn't
 * genuine, this call fails and we reject the session.
 */
export async function verifySalesforceSession({ accessToken, instanceUrl }) {
  const { data } = await axios.get(`${instanceUrl}/services/oauth2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const userId = data.user_id || (data.sub ? data.sub.split('/').pop() : null);
  return { userId, username: data.name || data.preferred_username || data.email };
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
