// postEngine.js

const TLL_PostEngine = (() => {
  const STORAGE_KEY = "TLL_POSTS";
  let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let remoteMode = false;

  const savePosts = () => {
    if (!remoteMode) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
  };

  const getAllPosts = async () => posts;

  const getPostsPaginated = (page = 1, perPage = 5, source = posts) => {
    const start = (page - 1) * perPage;
    return source.slice(start, start + perPage);
  };

  const addPost = (title, body, tags = []) => {
    title = (title ?? "").toString().trim();
    body = (body ?? "").toString().trim();

    const id = Date.now().toString();
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
    const date = new Date().toISOString();

    const post = { id, slug, title, body, tags, date };
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
    disableRemoteMode
  };
})();

window.TLL_PostEngine = TLL_PostEngine;
