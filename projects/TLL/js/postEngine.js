// postEngine.js

const TLL_PostEngine = (() => {
  const STORAGE_KEY = "TLL_POSTS";
  let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  // Initialize from posts.json if localStorage is empty
  if (posts.length === 0) {
    fetch('/blog/posts/posts.json')
      .then(res => res.json())
      .then(data => {
        posts = data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        window.dispatchEvent(new Event("reloadPosts"));
      })
      .catch(err => console.error("Failed to load posts.json:", err));
  }
  let remoteMode = false;

  const savePosts = () => {
    if (!remoteMode) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
  };

  const getAllPosts = () => posts;

  const getPostsPaginated = (page = 1, perPage = 5, source = posts) => {
    const start = (page - 1) * perPage;
    return source.slice(start, start + perPage);
  };

  const getPostById = (id) => posts.find(p => p.id === id);

  const updatePost = (updated) => {
    const index = posts.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      posts[index] = updated;
      savePosts();
    }
  };

  const addPost = (input) => {
    const title = (input?.title ?? "").toString().trim();
    const body = (input?.body ?? "").toString().trim();
    const tags = Array.isArray(input?.tags) ? input.tags : [];
    const id = input?.id ?? Date.now().toString();
    const slug = input?.slug ?? title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const date = input?.date ?? new Date().toISOString();

    const post = { id, slug, title, body, tags, date, comments: [] };
    posts.push(post);
    savePosts();

    window.dispatchEvent(new Event("reloadPosts"));
  };

  const enableRemoteMode = () => { remoteMode = true; };
  const disableRemoteMode = () => { remoteMode = false; };

  return {
    getAllPosts,
    getPostsPaginated,
    addPost,
    enableRemoteMode,
    disableRemoteMode,
    getPostById,
    updatePost
  };
})();

window.TLL_PostEngine = TLL_PostEngine;
