(function () {
  "use strict";

  var STORAGE_KEY = "portfolioProductGallery_v1";
  var MAX_WIDTH = 1200;
  var JPEG_QUALITY = 0.82;
  var MAX_ITEMS = 40;

  var input = document.getElementById("product-input");
  var grid = document.getElementById("gallery-grid");
  var emptyMsg = document.getElementById("gallery-empty");
  var clearBtn = document.getElementById("clear-gallery");
  var warnEl = document.getElementById("storage-warning");
  var navToggle = document.querySelector(".nav-toggle");
  var navPanel = document.getElementById("nav-panel");

  function loadProducts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveProducts(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      warnEl.hidden = true;
      warnEl.textContent = "";
    } catch (e) {
      warnEl.hidden = false;
      warnEl.textContent =
        "Could not save all images (browser storage may be full). Try removing some photos or use smaller files.";
    }
  }

  function resizeToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        if (w > MAX_WIDTH) {
          h = Math.round((h * MAX_WIDTH) / w);
          w = MAX_WIDTH;
        }
        var canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });
  }

  function renderGallery() {
    var items = loadProducts();
    grid.innerHTML = "";

    if (items.length === 0) {
      emptyMsg.classList.remove("is-hidden");
      return;
    }
    emptyMsg.classList.add("is-hidden");

    items.forEach(function (item) {
      var figure = document.createElement("figure");
      figure.className = "gallery-item";
      figure.setAttribute("role", "listitem");

      var img = document.createElement("img");
      img.src = item.dataUrl;
      img.alt = item.title || "Portfolio piece";
      img.loading = "lazy";

      var cap = document.createElement("figcaption");
      var titleSpan = document.createElement("span");
      titleSpan.className = "title";
      titleSpan.textContent = item.title || "Untitled";

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-photo";
      removeBtn.textContent = "Remove";
      removeBtn.setAttribute("aria-label", "Remove " + (item.title || "photo"));
      removeBtn.addEventListener("click", function () {
        var next = loadProducts().filter(function (p) {
          return p.id !== item.id;
        });
        saveProducts(next);
        renderGallery();
      });

      cap.appendChild(titleSpan);
      cap.appendChild(removeBtn);
      figure.appendChild(img);
      figure.appendChild(cap);
      grid.appendChild(figure);
    });
  }

  async function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;

    var products = loadProducts();
    for (var i = 0; i < files.length; i++) {
      if (products.length >= MAX_ITEMS) {
        warnEl.hidden = false;
        warnEl.textContent =
          "Maximum of " + MAX_ITEMS + " photos reached. Remove some to add more.";
        break;
      }
      var file = files[i];
      if (!file.type || file.type.indexOf("image/") !== 0) continue;
      try {
        var dataUrl = await resizeToDataUrl(file);
        products.push({
          id: Date.now() + Math.random(),
          dataUrl: dataUrl,
          title: file.name.replace(/\.[^/.]+$/, "") || "Photo",
        });
      } catch (e) {
        warnEl.hidden = false;
        warnEl.textContent = "One or more images could not be processed.";
      }
    }
    saveProducts(products);
    renderGallery();
    input.value = "";
  }

  if (input) {
    input.addEventListener("change", function () {
      handleFiles(input.files);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (confirm("Remove all saved product photos from this browser?")) {
        localStorage.removeItem(STORAGE_KEY);
        warnEl.hidden = true;
        warnEl.textContent = "";
        renderGallery();
      }
    });
  }

  /* Mobile nav */
  if (navToggle && navPanel) {
    navToggle.addEventListener("click", function () {
      var open = navPanel.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    navPanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navPanel.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  renderGallery();
})();
