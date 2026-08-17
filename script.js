/**
 * Visual Fetch - The Image Library
 * Clean, lightweight, and modern image search application using Unsplash API.
 * Developed by Shubham Dixit.
 */

// Unsplash API Keys (primary with fallback)
const API_KEYS = [
  "moh9ogmpy_MXM_5qAVVC1KHgjEYToM0APrkVaZLnTsk",
  "SouHY7Uul-OxoMl3LL3c0NkxUtjIrKwf3tsGk1JaiVo"
];
let currentKeyIndex = 0;

function getApiKey() {
  return API_KEYS[currentKeyIndex];
}

function rotateApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
}

// App State
const state = {
  query: "",
  category: "",
  orientation: "",
  orderBy: "relevant",
  page: 1,
  perPage: 20,
  photos: [],
  isLoading: false,
  hasMore: true,
  currentModalIndex: -1,
  favorites: [],
  columnCount: 4
};

// DOM References
const brandLogo = document.getElementById("brandLogo");
const navRandomBtn = document.getElementById("navRandomBtn");
const openFavoritesBtn = document.getElementById("openFavoritesBtn");
const favoritesCount = document.getElementById("favoritesCount");

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const categoryChips = document.getElementById("categoryChips");

const resultsQueryTitle = document.getElementById("resultsQueryTitle");
const resultsCountBadge = document.getElementById("resultsCountBadge");
const orientationSelect = document.getElementById("orientationSelect");
const sortSelect = document.getElementById("sortSelect");

const masonryGrid = document.getElementById("masonryGrid");
const skeletonGrid = document.getElementById("skeletonGrid");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const errorDescription = document.getElementById("errorDescription");
const retryBtn = document.getElementById("retryBtn");
const suggestedTags = document.getElementById("suggestedTags");

const loadMoreContainer = document.getElementById("loadMoreContainer");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const currentYear = document.getElementById("currentYear");

// Lightbox Modal References
const lightboxModal = document.getElementById("lightboxModal");
const modalAuthorAvatar = document.getElementById("modalAuthorAvatar");
const modalAuthorName = document.getElementById("modalAuthorName");
const modalAuthorLink = document.getElementById("modalAuthorLink");
const modalAuthorUsername = document.getElementById("modalAuthorUsername");
const modalFavoriteBtn = document.getElementById("modalFavoriteBtn");
const modalShareBtn = document.getElementById("modalShareBtn");
const modalDownloadMainBtn = document.getElementById("modalDownloadMainBtn");
const downloadToggleBtn = document.getElementById("downloadToggleBtn");
const downloadMenu = document.getElementById("downloadMenu");
const modalFullDimensions = document.getElementById("modalFullDimensions");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalPrevBtn = document.getElementById("modalPrevBtn");
const modalNextBtn = document.getElementById("modalNextBtn");
const modalImage = document.getElementById("modalImage");
const modalLikesCount = document.getElementById("modalLikesCount");
const modalDimensions = document.getElementById("modalDimensions");
const modalAltText = document.getElementById("modalAltText");
const modalTagsContainer = document.getElementById("modalTagsContainer");

// Favorites Drawer References
const favoritesDrawer = document.getElementById("favoritesDrawer");
const favoritesDrawerBackdrop = document.getElementById("favoritesDrawerBackdrop");
const closeFavoritesBtn = document.getElementById("closeFavoritesBtn");
const drawerCount = document.getElementById("drawerCount");
const favoritesGrid = document.getElementById("favoritesGrid");
const drawerEmpty = document.getElementById("drawerEmpty");
const drawerFooter = document.getElementById("drawerFooter");
const openClearDialogBtn = document.getElementById("openClearDialogBtn");

// Custom Confirmation Dialog References
const confirmDialog = document.getElementById("confirmDialog");
const dialogCancelBtn = document.getElementById("dialogCancelBtn");
const dialogConfirmBtn = document.getElementById("dialogConfirmBtn");

// Toast Container Reference
const toastContainer = document.getElementById("toastContainer");

/* ==========================================================================
   Initialize App
   ========================================================================== */
function init() {
  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  loadFavorites();
  state.columnCount = getResponsiveColumnCount();
  setupEventListeners();

  // Initial load: fetch curated trending visuals
  fetchPhotos(true);
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */
function setupEventListeners() {
  // Brand Logo Click -> Smoothly scroll to top and reset to home
  brandLogo.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (state.query || state.category || state.orientation || state.page > 1) {
      resetFilters();
      fetchPhotos(true);
    }
  });

  // Search Form Submit
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    handleSearch(query);
  });

  // Search Input Clear Button
  searchInput.addEventListener("input", () => {
    clearBtn.style.display = searchInput.value.trim() ? "flex" : "none";
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.style.display = "none";
    searchInput.focus();
  });

  // Keyboard Shortcuts ('/' to search, ESC to close modal, arrows to navigate)
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchInput && !lightboxModal.classList.contains("active")) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }

    if (lightboxModal.classList.contains("active")) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox(-1);
      if (e.key === "ArrowRight") navigateLightbox(1);
    }

    if (confirmDialog.classList.contains("active") && e.key === "Escape") {
      closeConfirmDialog();
    }
  });

  // Mobile / Browser Hardware Back Button Handling
  window.addEventListener("popstate", () => {
    if (confirmDialog.classList.contains("active")) {
      closeConfirmDialog(true);
    } else if (lightboxModal.classList.contains("active")) {
      closeLightbox(true);
    } else if (favoritesDrawer.classList.contains("active")) {
      closeFavoritesDrawer(true);
    }
  });

  // Category Chips
  categoryChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip-item");
    if (!chip) return;

    document.querySelectorAll(".chip-item").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");

    const category = chip.dataset.category || "";
    state.category = category;

    if (category) {
      searchInput.value = category;
      clearBtn.style.display = "flex";
      handleSearch(category);
    } else {
      resetFilters();
      fetchPhotos(true);
    }
  });

  // Filter Selects (Orientation & Sorting)
  orientationSelect.addEventListener("change", () => {
    state.orientation = orientationSelect.value;
    state.page = 1;
    state.hasMore = true;
    fetchPhotos(true);
  });

  sortSelect.addEventListener("change", () => {
    state.orderBy = sortSelect.value;
    state.page = 1;
    state.hasMore = true;
    fetchPhotos(true);
  });

  // Random Discovery
  navRandomBtn.addEventListener("click", () => {
    resetFilters();
    resultsQueryTitle.textContent = "Random Inspiration";
    resultsCountBadge.textContent = "Shuffle";
    fetchRandomPhotos(20);
  });

  // Load More Button
  loadMoreBtn.addEventListener("click", () => {
    if (!state.isLoading && state.hasMore) {
      state.page++;
      fetchPhotos(false);
    }
  });

  // Retry Button
  retryBtn.addEventListener("click", () => {
    fetchPhotos(true);
  });

  // Suggested Tags (in empty state)
  suggestedTags.addEventListener("click", (e) => {
    const tag = e.target.closest(".tag-pill");
    if (tag && tag.dataset.query) {
      searchInput.value = tag.dataset.query;
      clearBtn.style.display = "flex";
      handleSearch(tag.dataset.query);
    }
  });

  // Footer Tag Links
  document.querySelectorAll(".footer-tag-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const query = link.dataset.search;
      if (query) {
        searchInput.value = query;
        clearBtn.style.display = "flex";
        handleSearch(query);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Scroll to Top
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add("visible");
    } else {
      scrollTopBtn.classList.remove("visible");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Lightbox Modal Controls
  modalCloseBtn.addEventListener("click", closeLightbox);
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  modalPrevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigateLightbox(-1);
  });

  modalNextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigateLightbox(1);
  });

  // Download Dropdown Toggle
  downloadToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    downloadMenu.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".download-dropdown-wrapper")) {
      downloadMenu.classList.remove("active");
    }
  });

  // Download Menu Selection
  downloadMenu.addEventListener("click", (e) => {
    const item = e.target.closest(".download-menu-item");
    if (!item) return;
    const size = item.dataset.size || "regular";
    downloadActiveImage(size);
    downloadMenu.classList.remove("active");
  });

  modalDownloadMainBtn.addEventListener("click", () => {
    downloadActiveImage("regular");
  });

  // Modal Favorite Toggle
  modalFavoriteBtn.addEventListener("click", () => {
    const photo = state.photos[state.currentModalIndex];
    if (photo) {
      toggleFavorite(photo);
      updateModalFavoriteState(photo.id);
    }
  });

  // Modal Share Button
  modalShareBtn.addEventListener("click", () => {
    const photo = state.photos[state.currentModalIndex];
    if (photo) {
      navigator.clipboard.writeText(photo.urls.regular).then(() => {
        showToast("Photo link copied to clipboard!", "success");
      });
    }
  });

  // Favorites Drawer Controls
  openFavoritesBtn.addEventListener("click", openFavoritesDrawer);
  closeFavoritesBtn.addEventListener("click", closeFavoritesDrawer);
  favoritesDrawerBackdrop.addEventListener("click", closeFavoritesDrawer);

  // Custom Clear All Dialog
  openClearDialogBtn.addEventListener("click", () => {
    openConfirmDialog();
  });

  dialogCancelBtn.addEventListener("click", () => {
    closeConfirmDialog();
  });

  dialogConfirmBtn.addEventListener("click", () => {
    state.favorites = [];
    saveFavorites();
    renderFavorites();
    updateCardFavoriteButtons();
    closeConfirmDialog();
    showToast("Cleared all saved favorites", "info");
  });

  confirmDialog.addEventListener("click", (e) => {
    if (e.target === confirmDialog) closeConfirmDialog();
  });

  // Window Resize -> Adjust Masonry Columns without shifting photos unnecessarily
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newCols = getResponsiveColumnCount();
      if (newCols !== state.columnCount && state.photos.length > 0) {
        state.columnCount = newCols;
        rebuildMasonryGrid();
      }
    }, 200);
  });
}

/* ==========================================================================
   Search & Filter Actions
   ========================================================================== */
function handleSearch(query) {
  state.query = query;
  state.page = 1;
  state.hasMore = true;

  // Sync Category Chips
  let matchFound = false;
  document.querySelectorAll(".chip-item").forEach(chip => {
    if (chip.dataset.category && chip.dataset.category.toLowerCase() === query.toLowerCase()) {
      chip.classList.add("active");
      matchFound = true;
    } else {
      chip.classList.remove("active");
    }
  });

  if (!matchFound && query) {
    document.querySelectorAll(".chip-item").forEach(c => c.classList.remove("active"));
  }

  fetchPhotos(true);
}

function resetFilters() {
  state.query = "";
  state.category = "";
  state.page = 1;
  state.hasMore = true;
  searchInput.value = "";
  clearBtn.style.display = "none";
  orientationSelect.value = "";
  state.orientation = "";

  document.querySelectorAll(".chip-item").forEach(c => c.classList.remove("active"));
  const trendingChip = document.querySelector('.chip-item[data-category=""]');
  if (trendingChip) trendingChip.classList.add("active");
}

/* ==========================================================================
   Unsplash API Calls
   ========================================================================== */
async function fetchPhotos(isNewSearch = false) {
  if (state.isLoading) return;

  state.isLoading = true;
  setLoadingUI(isNewSearch);

  try {
    const key = getApiKey();
    const order = state.orderBy || "relevant";
    let endpoint = "";

    // Determine query: use user search query or fallback if orientation is selected
    const activeSearchQuery = state.query || (state.orientation ? (state.category || "aesthetic") : "");

    if (activeSearchQuery) {
      let url = `https://api.unsplash.com/search/photos?page=${state.page}&per_page=${state.perPage}&query=${encodeURIComponent(activeSearchQuery)}&order_by=${order}&client_id=${key}`;
      if (state.orientation) {
        url += `&orientation=${state.orientation}`;
      }
      endpoint = url;
    } else {
      const orderParam = order === "latest" ? "latest" : "popular";
      endpoint = `https://api.unsplash.com/photos?page=${state.page}&per_page=${state.perPage}&order_by=${orderParam}&client_id=${key}`;
    }

    const response = await fetch(endpoint);

    // Handle rate limit fallback
    if (response.status === 403 || response.status === 429) {
      rotateApiKey();
      const retryUrl = endpoint.replace(/client_id=[^&]+/, `client_id=${getApiKey()}`);
      const retryResponse = await fetch(retryUrl);
      if (!retryResponse.ok) throw new Error("API rate limit reached. Please try again shortly.");
      const retryData = await retryResponse.json();
      onFetchSuccess(retryData, isNewSearch);
      return;
    }

    if (!response.ok) {
      throw new Error(`Error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    onFetchSuccess(data, isNewSearch);

  } catch (error) {
    console.error("Fetch Photos Error:", error);
    onFetchError(error, isNewSearch);
  } finally {
    state.isLoading = false;
    skeletonGrid.style.display = "none";
    const spinner = loadMoreBtn.querySelector(".spinner");
    const btnText = loadMoreBtn.querySelector(".btn-text");
    if (spinner) spinner.style.display = "none";
    if (btnText) btnText.textContent = "Load More Visuals";
    loadMoreBtn.disabled = false;
  }
}

async function fetchRandomPhotos(count = 20) {
  state.isLoading = true;
  setLoadingUI(true);

  try {
    const key = getApiKey();
    const response = await fetch(`https://api.unsplash.com/photos/random?count=${count}&client_id=${key}`);
    if (!response.ok) throw new Error("Failed to load random visuals.");
    
    const data = await response.json();
    const normalized = data.map(item => formatPhotoObject(item));
    state.photos = normalized;

    renderMasonryPhotos(normalized, true);

    emptyState.style.display = "none";
    errorState.style.display = "none";
    loadMoreContainer.style.display = "flex";
    resultsCountBadge.textContent = `${normalized.length} photos`;

  } catch (error) {
    console.error("Random fetch error:", error);
    onFetchError(error, true);
  } finally {
    state.isLoading = false;
    skeletonGrid.style.display = "none";
  }
}

function onFetchSuccess(data, isNewSearch) {
  let rawList = [];
  let totalCount = null;

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data.results) {
    rawList = data.results;
    totalCount = data.total;
  }

  const normalized = rawList.map(item => formatPhotoObject(item));

  if (isNewSearch) {
    state.photos = normalized;
    renderMasonryPhotos(normalized, true);
  } else {
    // Append to existing photos without resetting
    state.photos.push(...normalized);
    renderMasonryPhotos(normalized, false);
  }

  // Update Result Headers with Orientation Details
  const orientName = state.orientation ? state.orientation.charAt(0).toUpperCase() + state.orientation.slice(1) : "";
  if (state.query) {
    const orientSuffix = orientName ? ` (${orientName})` : "";
    resultsQueryTitle.textContent = `Search results for "${state.query}"${orientSuffix}`;
    resultsCountBadge.textContent = totalCount !== null ? `${totalCount.toLocaleString()} found` : `${state.photos.length} photos`;
  } else if (orientName) {
    resultsQueryTitle.textContent = `Curated ${orientName} Visuals`;
    resultsCountBadge.textContent = totalCount !== null ? `${totalCount.toLocaleString()} found` : `${state.photos.length} photos`;
  } else {
    resultsQueryTitle.textContent = "Curated Trending Visuals";
    resultsCountBadge.textContent = `${state.photos.length} photos`;
  }

  // Check Empty / Loaded States
  if (state.photos.length === 0) {
    emptyState.style.display = "block";
    errorState.style.display = "none";
    loadMoreContainer.style.display = "none";
  } else {
    emptyState.style.display = "none";
    errorState.style.display = "none";
    loadMoreContainer.style.display = "flex";
  }

  if (normalized.length < state.perPage) {
    state.hasMore = false;
    loadMoreBtn.disabled = true;
    loadMoreBtn.querySelector(".btn-text").textContent = "All Visuals Loaded";
  } else {
    state.hasMore = true;
    loadMoreBtn.disabled = false;
    loadMoreBtn.querySelector(".btn-text").textContent = "Load More Visuals";
  }
}

function onFetchError(error, isNewSearch) {
  if (isNewSearch) {
    masonryGrid.innerHTML = "";
    emptyState.style.display = "none";
    errorState.style.display = "block";
    loadMoreContainer.style.display = "none";
    errorMessage.textContent = "Unable to fetch images";
    errorDescription.textContent = error.message || "Network issue or API limit reached. Please try again shortly.";
  }
  showToast(error.message || "Failed to load photos", "error");
}

function setLoadingUI(isNewSearch) {
  if (isNewSearch) {
    masonryGrid.innerHTML = "";
    skeletonGrid.style.display = "flex";
    emptyState.style.display = "none";
    errorState.style.display = "none";
    loadMoreContainer.style.display = "none";
  } else {
    const spinner = loadMoreBtn.querySelector(".spinner");
    const btnText = loadMoreBtn.querySelector(".btn-text");
    if (spinner) spinner.style.display = "inline-block";
    if (btnText) btnText.textContent = "Fetching...";
    loadMoreBtn.disabled = true;
  }
}

function formatPhotoObject(photo) {
  return {
    id: photo.id,
    alt: photo.alt_description || photo.description || "Unsplash photograph",
    description: photo.description || photo.alt_description || "",
    width: photo.width || 1920,
    height: photo.height || 1080,
    color: photo.color || "#111827",
    likes: photo.likes || 0,
    createdAt: photo.created_at || "",
    urls: {
      raw: photo.urls?.raw || photo.urls?.regular,
      full: photo.urls?.full || photo.urls?.regular,
      regular: photo.urls?.regular,
      small: photo.urls?.small || photo.urls?.regular,
      thumb: photo.urls?.thumb || photo.urls?.small
    },
    links: {
      html: photo.links?.html || `https://unsplash.com/photos/${photo.id}`,
      download: photo.links?.download || photo.urls?.full,
      downloadLocation: photo.links?.download_location
    },
    user: {
      id: photo.user?.id,
      name: photo.user?.name || "Photographer",
      username: photo.user?.username || "creator",
      profileUrl: photo.user?.links?.html || `https://unsplash.com/@${photo.user?.username}`,
      avatar: photo.user?.profile_image?.medium || photo.user?.profile_image?.small || "logo.svg"
    },
    tags: (photo.tags || []).map(t => typeof t === "string" ? t : t.title)
  };
}

/* ==========================================================================
   Multi-Column Masonry Gallery Rendering
   Fix: New images append to columns below previous ones without reflowing!
   ========================================================================== */
function getResponsiveColumnCount() {
  const w = window.innerWidth;
  if (w <= 540) return 1;
  if (w <= 768) return 2;
  if (w <= 1200) return 3;
  return 4;
}

function initColumnElements(count) {
  masonryGrid.innerHTML = "";
  const cols = [];
  for (let i = 0; i < count; i++) {
    const col = document.createElement("div");
    col.className = "masonry-col";
    col.dataset.colIndex = i;
    masonryGrid.appendChild(col);
    cols.push(col);
  }
  return cols;
}

function getExistingColumns() {
  return Array.from(masonryGrid.querySelectorAll(".masonry-col"));
}

function renderMasonryPhotos(photosToRender, clearExisting = false) {
  let cols = getExistingColumns();
  const targetColCount = state.columnCount || getResponsiveColumnCount();

  // If new search or column count changed, reinitialize column divs
  if (clearExisting || cols.length !== targetColCount) {
    cols = initColumnElements(targetColCount);
  }

  // Append each new card into columns evenly
  photosToRender.forEach((photo, index) => {
    const card = createPhotoCard(photo);
    
    // Choose column with shortest current height or round-robin
    let targetCol = cols[0];
    let minChildCount = cols[0].children.length;

    for (let c = 1; c < cols.length; c++) {
      if (cols[c].children.length < minChildCount) {
        minChildCount = cols[c].children.length;
        targetCol = cols[c];
      }
    }

    targetCol.appendChild(card);
  });
}

function rebuildMasonryGrid() {
  const allPhotos = [...state.photos];
  renderMasonryPhotos(allPhotos, true);
}

function createPhotoCard(photo) {
  const card = document.createElement("div");
  card.className = "photo-card";
  card.dataset.id = photo.id;

  const isFav = isPhotoFavorite(photo.id);

  card.innerHTML = `
    <div class="photo-img-wrapper" style="background-color: ${photo.color}">
      <img 
        src="${photo.urls.small}" 
        alt="${escapeHtml(photo.alt)}" 
        class="photo-img" 
        loading="lazy"
      >
      <div class="card-overlay">
        <div class="overlay-top">
          <button 
            class="card-action-btn ${isFav ? 'active-favorite' : ''}" 
            data-action="favorite" 
            title="${isFav ? 'Remove from favorites' : 'Save to favorites'}"
          >
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <button class="card-action-btn" data-action="share" title="Copy link">
            <i class="fa-solid fa-link"></i>
          </button>
        </div>
        
        <div class="overlay-bottom">
          <a 
            href="${photo.user.profileUrl}?utm_source=visual_fetch&utm_medium=referral" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="author-chip"
            data-action="author-link"
            title="View ${escapeHtml(photo.user.name)} on Unsplash"
          >
            <img src="${photo.user.avatar}" alt="${escapeHtml(photo.user.name)}" class="author-avatar" loading="lazy">
            <span class="author-name">${escapeHtml(photo.user.name)}</span>
          </a>

          <button class="btn-card-download" data-action="download" title="Download">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // Click Actions
  card.addEventListener("click", (e) => {
    const actionEl = e.target.closest("[data-action]");
    if (actionEl) {
      const action = actionEl.dataset.action;
      if (action === "favorite") {
        e.stopPropagation();
        toggleFavorite(photo);
        const icon = actionEl.querySelector("i");
        if (isPhotoFavorite(photo.id)) {
          actionEl.classList.add("active-favorite");
          icon.className = "fa-solid fa-heart";
        } else {
          actionEl.classList.remove("active-favorite");
          icon.className = "fa-regular fa-heart";
        }
      } else if (action === "share") {
        e.stopPropagation();
        navigator.clipboard.writeText(photo.urls.regular).then(() => {
          showToast("Photo link copied to clipboard!", "success");
        });
      } else if (action === "download") {
        e.stopPropagation();
        downloadImageDirect(photo, "regular");
      }
    } else {
      // Open Lightbox Modal
      const index = state.photos.findIndex(p => p.id === photo.id);
      openLightbox(index >= 0 ? index : 0);
    }
  });

  return card;
}

/* ==========================================================================
   Lightbox Modal
   ========================================================================== */
function openLightbox(index) {
  if (index < 0 || index >= state.photos.length) return;
  state.currentModalIndex = index;
  const photo = state.photos[index];

  modalAuthorAvatar.src = photo.user.avatar;
  modalAuthorName.textContent = photo.user.name;
  modalAuthorUsername.textContent = `@${photo.user.username}`;
  modalAuthorLink.href = `${photo.user.profileUrl}?utm_source=visual_fetch&utm_medium=referral`;

  modalImage.src = photo.urls.regular;
  modalImage.alt = photo.alt;

  // Preload full resolution image
  const fullImg = new Image();
  fullImg.src = photo.urls.full;
  fullImg.onload = () => {
    if (state.currentModalIndex === index) {
      modalImage.src = photo.urls.full;
    }
  };

  modalLikesCount.textContent = photo.likes.toLocaleString();
  modalDimensions.textContent = `${photo.width} × ${photo.height}`;
  modalFullDimensions.textContent = `${photo.width} × ${photo.height} (HD)`;
  modalAltText.textContent = photo.description || photo.alt || "No description provided";

  // Tags
  modalTagsContainer.innerHTML = "";
  if (photo.tags && photo.tags.length > 0) {
    photo.tags.slice(0, 5).forEach(tag => {
      const chip = document.createElement("span");
      chip.className = "modal-tag-chip";
      chip.textContent = `#${tag}`;
      chip.addEventListener("click", () => {
        closeLightbox();
        searchInput.value = tag;
        clearBtn.style.display = "flex";
        handleSearch(tag);
      });
      modalTagsContainer.appendChild(chip);
    });
  }

  updateModalFavoriteState(photo.id);

  // Prev / Next button visibility
  modalPrevBtn.style.display = index > 0 ? "flex" : "none";
  modalNextBtn.style.display = index < state.photos.length - 1 ? "flex" : "none";

  // Push history state if opening fresh
  if (!lightboxModal.classList.contains("active")) {
    try {
      history.pushState({ modal: "lightbox" }, "");
    } catch (e) {}
  }

  lightboxModal.classList.add("active");
  lightboxModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox(isFromPopState = false) {
  if (!lightboxModal.classList.contains("active")) return;
  lightboxModal.classList.remove("active");
  lightboxModal.setAttribute("aria-hidden", "true");
  downloadMenu.classList.remove("active");
  document.body.style.overflow = "";

  if (!isFromPopState && history.state && history.state.modal === "lightbox") {
    try {
      history.back();
    } catch (e) {}
  }
}

function navigateLightbox(direction) {
  const newIndex = state.currentModalIndex + direction;
  if (newIndex >= 0 && newIndex < state.photos.length) {
    openLightbox(newIndex);
  }
}

function updateModalFavoriteState(photoId) {
  const isFav = isPhotoFavorite(photoId);
  const icon = modalFavoriteBtn.querySelector("i");
  if (isFav) {
    modalFavoriteBtn.classList.add("active-favorite");
    icon.className = "fa-solid fa-heart";
  } else {
    modalFavoriteBtn.classList.remove("active-favorite");
    icon.className = "fa-regular fa-heart";
  }
}

function downloadActiveImage(size = "regular") {
  const photo = state.photos[state.currentModalIndex];
  if (photo) {
    downloadImageDirect(photo, size);
  }
}

function downloadImageDirect(photo, size = "regular") {
  let downloadUrl = photo.urls.regular;
  if (size === "small") downloadUrl = photo.urls.small;
  if (size === "full") downloadUrl = photo.urls.full || photo.links.download;

  showToast("Starting download...", "info");

  // Track download with Unsplash API
  if (photo.links.downloadLocation) {
    fetch(`${photo.links.downloadLocation}&client_id=${getApiKey()}`).catch(() => {});
  }

  fetch(downloadUrl)
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = blobUrl;
      a.download = `visual-fetch-${photo.id}-${size}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      showToast("Download finished successfully!", "success");
    })
    .catch(() => {
      window.open(downloadUrl, "_blank");
      showToast("Opened full visual in new tab", "info");
    });
}

/* ==========================================================================
   Favorites & LocalStorage Management
   ========================================================================== */
function loadFavorites() {
  try {
    const saved = localStorage.getItem("visual_fetch_favorites");
    state.favorites = saved ? JSON.parse(saved) : [];
  } catch (e) {
    state.favorites = [];
  }
  updateFavoritesCount();
}

function saveFavorites() {
  try {
    localStorage.setItem("visual_fetch_favorites", JSON.stringify(state.favorites));
  } catch (e) {}
  updateFavoritesCount();
}

function isPhotoFavorite(photoId) {
  return state.favorites.some(item => item.id === photoId);
}

function toggleFavorite(photo) {
  const index = state.favorites.findIndex(item => item.id === photo.id);
  if (index >= 0) {
    state.favorites.splice(index, 1);
    showToast("Removed from favorites", "info");
  } else {
    state.favorites.unshift({
      id: photo.id,
      alt: photo.alt,
      urls: photo.urls,
      user: photo.user,
      likes: photo.likes,
      width: photo.width,
      height: photo.height,
      color: photo.color,
      links: photo.links
    });
    showToast("Saved to favorites!", "heart");
  }
  saveFavorites();
  updateCardFavoriteButtons();
}

function updateFavoritesCount() {
  const count = state.favorites.length;
  if (favoritesCount) favoritesCount.textContent = count;
  if (drawerCount) drawerCount.textContent = count;
}

function updateCardFavoriteButtons() {
  document.querySelectorAll(".photo-card").forEach(card => {
    const photoId = card.dataset.id;
    const favBtn = card.querySelector('[data-action="favorite"]');
    if (favBtn) {
      const icon = favBtn.querySelector("i");
      if (isPhotoFavorite(photoId)) {
        favBtn.classList.add("active-favorite");
        icon.className = "fa-solid fa-heart";
      } else {
        favBtn.classList.remove("active-favorite");
        icon.className = "fa-regular fa-heart";
      }
    }
  });
}

function openFavoritesDrawer() {
  renderFavorites();
  if (!favoritesDrawer.classList.contains("active")) {
    try {
      history.pushState({ modal: "favorites" }, "");
    } catch (e) {}
  }
  favoritesDrawer.classList.add("active");
  favoritesDrawerBackdrop.classList.add("active");
  favoritesDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeFavoritesDrawer(isFromPopState = false) {
  if (!favoritesDrawer.classList.contains("active")) return;
  favoritesDrawer.classList.remove("active");
  favoritesDrawerBackdrop.classList.remove("active");
  favoritesDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (!isFromPopState && history.state && history.state.modal === "favorites") {
    try {
      history.back();
    } catch (e) {}
  }
}

function renderFavorites() {
  favoritesGrid.innerHTML = "";

  if (state.favorites.length === 0) {
    drawerEmpty.style.display = "block";
    drawerFooter.style.display = "none";
    return;
  }

  drawerEmpty.style.display = "none";
  drawerFooter.style.display = "block";

  state.favorites.forEach((photo) => {
    const card = document.createElement("div");
    card.className = "fav-card";
    card.innerHTML = `
      <img src="${photo.urls.small}" alt="${escapeHtml(photo.alt)}" class="fav-img" loading="lazy">
      <button class="fav-remove-btn" title="Remove from favorites">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    card.querySelector(".fav-remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(photo);
      renderFavorites();
    });

    card.addEventListener("click", () => {
      let idx = state.photos.findIndex(p => p.id === photo.id);
      if (idx < 0) {
        state.photos.unshift(photo);
        idx = 0;
      }
      closeFavoritesDrawer();
      openLightbox(idx);
    });

    favoritesGrid.appendChild(card);
  });
}

/* ==========================================================================
   Custom Confirmation Dialog Modal
   ========================================================================== */
function openConfirmDialog() {
  if (!confirmDialog.classList.contains("active")) {
    try {
      history.pushState({ modal: "confirm" }, "");
    } catch (e) {}
  }
  confirmDialog.classList.add("active");
  confirmDialog.setAttribute("aria-hidden", "false");
}

function closeConfirmDialog(isFromPopState = false) {
  if (!confirmDialog.classList.contains("active")) return;
  confirmDialog.classList.remove("active");
  confirmDialog.setAttribute("aria-hidden", "true");

  if (!isFromPopState && history.state && history.state.modal === "confirm") {
    try {
      history.back();
    } catch (e) {}
  }
}

/* ==========================================================================
   Toast Notifications
   ========================================================================== */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type === 'heart' ? 'toast-heart' : ''}`;

  let iconClass = "fa-solid fa-circle-check";
  if (type === "error") iconClass = "fa-solid fa-circle-exclamation";
  if (type === "info") iconClass = "fa-solid fa-circle-info";
  if (type === "heart") iconClass = "fa-solid fa-heart";

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <span>${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px) scale(0.9)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2600);
}

/* ==========================================================================
   Utility Helpers
   ========================================================================== */
function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/[&<>'"]/g, match => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return map[match] || match;
  });
}

// Start application
document.addEventListener("DOMContentLoaded", init);
