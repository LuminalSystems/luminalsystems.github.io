// editorPanel.js

function openPostEditor() {
  const panel = document.getElementById("postEditorPanel");
  if (!panel) return;
  panel.classList.add("show");
}

function closeEditor() {
  const panel = document.getElementById("postEditorPanel");
  if (!panel) return;
  panel.classList.remove("show");
  document.getElementById("postTitle").value = "";
  document.getElementById("postBody").value = "";
  document.getElementById("postTags").value = "";
}

function submitPost() {
  const title = document.getElementById("postTitle")?.value.trim();
  const body = document.getElementById("postBody")?.value.trim();
  const tags = document.getElementById("postTags").value.split(",").map(t => t.trim()).filter(t => t);

  if (!title || !body) {
    alert("Please enter both a title and body.");
    return;
  }

  if (typeof TLL_PostEngine?.addPost === "function") { 
    TLL_PostEngine.addPost(title, body, tags);
    closeEditor();
  } else {
    console.error("TLL_PostEngine.addPost is not a function.");
  }

  const post = {
    id: Date.now(),
    title,
    body,
    tags,
    date: new Date().toISOString(),
    slug: title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()
  };

  TLL_PostEngine.addPost(post);
  closeEditor();
  document.dispatchEvent(new Event("reloadPosts"));
}

// Expose to global scope for onclick handlers
window.TLL_Editor = {
  launchPostEditor: openPostEditor,
  closeEditor,
  submitPost
};

// Optional: wire up the New Post button
window.addEventListener("DOMContentLoaded", () => {
  const newPostBtn = document.getElementById("newPostBtn");
  if (newPostBtn) {
    newPostBtn.addEventListener("click", openPostEditor);
  }
});

