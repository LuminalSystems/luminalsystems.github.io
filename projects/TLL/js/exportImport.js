// exportImport.js

function exportTLLData() {
    const posts = window.TLL_PostEngine.getAllPosts();
    if (!Array.isArray(posts)) {
      alert("Post data is corrupted or not exportable.");
      return;
    }
  
    const comments = posts.reduce((acc, p) => {
      const raw = localStorage.getItem(`TLL_COMMENTS_${p.id}`);
      try {
        acc[p.id] = raw ? JSON.parse(raw) : [];
      } catch {
        acc[p.id] = [];
      }
      return acc;
    }, {});
  
    const blob = new Blob([JSON.stringify({ posts, comments }, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tll-backup.json";
    link.click();
  }
  
  function importTLLData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.posts)) throw new Error("Invalid post format");
  
        localStorage.setItem("TLL_POSTS", JSON.stringify(parsed.posts));
        Object.entries(parsed.comments || {}).forEach(([pid, data]) => {
          localStorage.setItem(`TLL_COMMENTS_${pid}`, JSON.stringify(data || []));
        });
  
        alert("Data imported. Refreshing...");
        location.reload();
      } catch (e) {
        alert("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }
  
  window.TLL_ExportImport = { exportTLLData, importTLLData };
  