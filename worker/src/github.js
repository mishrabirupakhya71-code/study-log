const GITHUB_API = 'https://api.github.com';

async function fetchGitHub(route, env, options = {}) {
  const url = `${GITHUB_API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${route}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_PAT}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'StudySync-Worker',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Search for an issue by title and label (e.g. today's daily log)
export async function findIssue(title, labels, env) {
  const query = `repo:${env.GITHUB_OWNER}/${env.GITHUB_REPO} is:issue in:title "${title}"`;
  const url = `${GITHUB_API}/search/issues?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_PAT}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'StudySync-Worker'
    }
  });
  const data = await response.json();

  // Filter by labels if provided
  if (data.items && data.items.length > 0 && labels) {
    return data.items.find(issue =>
      labels.every(l => issue.labels.some(il => il.name === l))
    );
  }
  return data.items?.[0];
}

export async function listIssues(labels, env) {
  let route = '/issues?state=all&per_page=30';
  if (labels) route += `&labels=${encodeURIComponent(labels)}`;
  return fetchGitHub(route, env);
}

export async function listComments(issueNumber, env) {
  return fetchGitHub(`/issues/${issueNumber}/comments`, env);
}

export async function createIssue(payload, env) {
  return fetchGitHub('/issues', env, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateIssue(issueNumber, payload, env) {
  return fetchGitHub(`/issues/${issueNumber}`, env, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function addComment(issueNumber, body, env) {
  return fetchGitHub(`/issues/${issueNumber}/comments`, env, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
}

export async function uploadReleaseAsset(imageBuffer, filename, env) {
  // Try to find the 'assets' release
  let releaseId;
  try {
    const release = await fetchGitHub('/releases/tags/assets', env);
    releaseId = release.id;
  } catch (e) {
    // Release does not exist, create it
    const newRelease = await fetchGitHub('/releases', env, {
      method: 'POST',
      body: JSON.stringify({
        tag_name: 'assets',
        name: 'Image Assets',
        body: 'Storage for StudySync uploaded images.'
      })
    });
    releaseId = newRelease.id;
  }

  // Upload the asset to the release
  const url = `https://uploads.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(filename)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_PAT}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'StudySync-Worker',
      'Content-Type': 'image/jpeg', // Or abstract based on file
    },
    body: imageBuffer
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.browser_download_url;
}