window.TLL_CommentEngine = (() => {
  const storageKey = "TLL_POSTS";
  let remoteMode = false;

  function getAllPosts() {
    const raw = localStorage.getItem(storageKey);
    try {
      const parsed = JSON.parse(raw || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveAllPosts(posts) {
    localStorage.setItem(storageKey, JSON.stringify(posts));
  }

  function findPost(id) {
    const posts = getAllPosts();
    return posts.find(p => p.id === id);
  }

  function findComment(comments, commentId) {
    for (const comment of comments || []) {
      if (comment.id === commentId) return comment;
      const child = findComment(comment.comments || [], commentId);
      if (child) return child;
    }
    return null;
  }

  function addComment(postId, parentId, author, content) {
    const post = TLL_PostEngine.getPostById(postId);
    if (!post) return;

    post.comments = Array.isArray(post.comments) ? post.comments : [];

    const newComment = {
      id: Date.now().toString(),
      author,
      content,
      date: new Date().toISOString(),
      comments: []
    };

    if (parentId) {
      const parent = findComment(post.comments, parentId);
      if (parent && Array.isArray(parent.comments)) {
        parent.comments.push(newComment);
      }
    } else {
      post.comments.push(newComment);
    }

    TLL_PostEngine.updatePost(post);
    renderComments(postId);
  }

  function renderComments(postId) {
    const post = findPost(postId);
    if (!post) return;

    post.comments = Array.isArray(post.comments) ? post.comments : [];

    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;

    container.innerHTML = `<strong>Comments</strong>`;
    renderCommentThread(post.comments, container, postId);
    container.appendChild(createReplyForm(postId, null)); // root comment form
  }

  function renderCommentThread(comments, parentEl, postId, depth = 0) {
    comments = Array.isArray(comments) ? comments : [];

    comments.forEach(comment => {
      const wrapper = document.createElement("div");
      wrapper.className = "comment-box";
      wrapper.style.marginLeft = `${depth * 20}px`;
      wrapper.innerHTML = `
        <p><strong>${comment.author}</strong> <em>(${new Date(comment.date).toLocaleString()})</em></p>
        <p>${comment.content}</p>
        <button class="reply-btn">Reply</button>
      `;

      const replyBtn = wrapper.querySelector(".reply-btn");
      replyBtn.onclick = () => {
        const form = createReplyForm(postId, comment.id);
        wrapper.appendChild(form);
        replyBtn.disabled = true;
      };

      parentEl.appendChild(wrapper);

      if (Array.isArray(comment.comments) && comment.comments.length > 0) {
        renderCommentThread(comment.comments, parentEl, postId, depth + 1);
      }
    });
  }

  function createReplyForm(postId, parentId) {
    const form = document.createElement("div");
    form.className = "reply-form";
    form.innerHTML = `
      <input type="text" placeholder="Your Name" class="comment-author"/>
      <input type="text" placeholder="Your Comment..." class="comment-content"/>
      <button class="submit-btn">Submit</button>
    `;

    const btn = form.querySelector(".submit-btn");
    btn.onclick = () => {
      const author = form.querySelector(".comment-author").value.trim();
      const content = form.querySelector(".comment-content").value.trim();
      if (!author || !content) return;

      addComment(postId, parentId, author, content);
    };

    return form;
  }

  return {
    renderComments,
    addComment,
    enableRemoteMode: () => (remoteMode = true),
    disableRemoteMode: () => (remoteMode = false),
    isRemoteMode: () => remoteMode
  };
})();
