const accessKey = "moh9ogmpy_MXM_5qAVVC1KHgjEYToM0APrkVaZLnTsk"; //my api
// const accessKey = "SouHY7Uul-OxoMl3LL3c0NkxUtjIrKwf3tsGk1JaiVo";


let page = 1;
let inputVal = document.querySelector(".search-input");
const showMore = document.querySelector(".btn-load");
const searchBtn = document.querySelector(".btn");
const clearBtn = document.querySelector(".clear");
const searchResults = document.querySelector(".search-results");
let reload_btn = document.querySelector(".heading");

// Function to fetch images from Unsplash based on search query and page
async function searchImages(query, page) {
  try {
    const response = await fetch(`https://api.unsplash.com/search/photos?page=${page}&query=${query}&client_id=${accessKey}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const imageInfo = data.results.map(photo => ({
      regularUrl: photo.urls.regular,
      downloadUrl: photo.links.download
    }));

    return imageInfo;
  } catch (error) {
    console.error('Error fetching images:', error);
  }
}

// Function to fetch random images from Unsplash
async function getRandomImages(count = 1) {
  try {
    const response = await fetch(`https://api.unsplash.com/photos/random?client_id=${accessKey}&count=${count}`);
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const imageInfo = data.map(photo => ({
      regularUrl: photo.urls.regular,
      downloadUrl: photo.links.download
    }));

    return imageInfo;
  } catch (error) {
    console.error('Error fetching random images:', error);
    alert(error + "\n Please try after some time");
  }
}

// Function to display images in the search results
function displayImages(images) {
  images.forEach(image => {
    const imgElement = document.createElement('div');
    imgElement.className = 'search-result';

    let img = document.createElement("img");
    img.src = image.regularUrl;
    img.alt = 'Unsplash image';
    
    img.addEventListener('click', () => {
      window.open(image.downloadUrl, '_blank');
    });
    
    imgElement.appendChild(img);
    searchResults.appendChild(imgElement);
  });
}

// Event listener for search button
searchBtn.addEventListener("click", () => {
  let query = inputVal.value.trim();

  if (query) {
    page = 1; // Reset page number for new search
    searchResults.innerHTML = ''; // Clear previous results
    searchImages(query, page).then(images => {
      if (images && images.length > 0) {
        displayImages(images);
      } else {
        searchResults.innerHTML = '<p>No results found.</p>';
      }
    });
  } else {
    searchResults.innerHTML = '<p>Please enter a search query.</p>';
  }
});

// Event listener to clear search input
clearBtn.addEventListener("click", () => {
  inputVal.value = '';
});

// Event listener for "Show More" button
showMore.addEventListener("click", () => {
  let query = inputVal.value.trim();

  if (query) {
    page++; // Increment page number for "Show More"
    searchImages(query, page).then(images => {
      if (images && images.length > 0) {
        displayImages(images);
      } else {
        // If no more results, disable "Show More" or display a message
      }
    });
  } else {
    getRandomImages(15).then(images => {
      if (images && images.length > 0) {
        displayImages(images);
      }
    });
  }
});

// Initial random images on window load
window.onload = () => {
  getRandomImages(15).then(images => {
    if (images && images.length > 0) {
      displayImages(images);
    }
  });
};

function refreshPage() {
  location.reload();
}
reload_btn.addEventListener('click', function() {
  refreshPage();
});


