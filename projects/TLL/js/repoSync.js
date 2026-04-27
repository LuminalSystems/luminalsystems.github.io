// repoSync.js

const GITHUB_REPO = "LuminalSystems/luminalsystems.github.io";
const BRANCH = "main";
let GITHUB_TOKEN = "";

function simulatePush() {
  const allPosts = window.TLL_ExportImport.exportTLLData();
  const blob = JSON.stringify(allPosts, null, 2);

  const confirm = window.confirm("Commit current posts to GitHub?");
  if (!confirm) return;

  if (!GITHUB_TOKEN) {
    GITHUB_TOKEN = prompt("Enter GitHub Personal Access Token:");
    if (!GITHUB_TOKEN) return alert("Token is required.");
  }

  uploadToGitHub("blog/posts/posts.json", blob, "Update posts");
}

async function uploadToGitHub(path, content, message) {
  const API = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

  const headers = {
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json"
  };

  try {
    const getRes = await fetch(API, { headers });
    const { sha } = await getRes.json();

    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const body = {
      message,
      content: encodedContent,
      sha,
      branch: BRANCH
    };

    const putRes = await fetch(API, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });

    if (!putRes.ok) throw new Error("GitHub push failed");

    alert("GitHub commit successful.");
  } catch (err) {
    console.error("Push failed:", err);
    alert("Push error: " + err.message);
  }
}

window.TLL_RepoSync = {
  simulatePush
};
