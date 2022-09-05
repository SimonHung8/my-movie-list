const BASE_URL = "https://movie-list.alphacamp.io";
const INDEX_URL = BASE_URL + "/api/v1/movies/";
const POSTER_URL = BASE_URL + "/posters/";
const MOVIES_PER_PAGE = 12;
const movies = [];
let filteredMovies = [];
// 將追蹤電影清單變更為全域變數
const favoriteList = JSON.parse(localStorage.getItem("favoriteMovies")) || [];
const dataPanel = document.querySelector("#data-panel");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const paginator = document.querySelector("#paginator");
// 新增模式切換節點
const btnSwitchMode = document.querySelector("#btn-switch-mode");
// 新增模式變數
let mode = "card";
// 新增當前分頁變數用以記錄切換模式時的分頁
let currentPage = 1;

// 原函式過於肥大，助教建議後修正如下
function renderMovieList(data) {
  let rawHTML = "";
  let button = "";
  data.forEach((item) => {
    if (favoriteList.some((favoriteItem) => favoriteItem.id === item.id)) {
      button = `<button class="btn btn-danger btn-remove-favorite" data-id="${item.id}">x</button>`;
    } else {
      button = `<button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>`;
    }
    if (mode === "card") {
      rawHTML += `
    <div class="col-sm-3">
        <div class="mb-2">
          <div class="card">
            <img
              src="${POSTER_URL + item.image}"
              class="card-img-top" alt="Movie Poster">
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
                data-bs-target="#movie-modal" data-id="${item.id}">More</button>
              ${button}
            </div>
          </div>
        </div>
      </div>
    `;
    } else if (mode === "list") {
      rawHTML += `
     <li class="list-group-item d-flex justify-content-between">
          <h5>${item.title}</h5>
          <div>
            <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal"
              data-id="${item.id}">More</button>
            ${button}
          </div>
        </li>
    `;
    }
  });
  if (mode === "card") {
    dataPanel.innerHTML = rawHTML;
  } else if (mode === "list") {
    dataPanel.innerHTML = `
    <ul class="list-group">
    ${rawHTML}
    </ul>
    `;
  }
}

function renderPaginator(amount) {
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE);
  let rawHTML = "";
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`;
  }
  paginator.innerHTML = rawHTML;
  // 新增第一頁分頁的樣式
  const firstPage = document.querySelector(".page-link");
  firstPage.style.color = "blue";
  firstPage.style.fontSize = "20px";
}

function getMoviesByPage(page) {
  const data = filteredMovies.length ? filteredMovies : movies;
  const startIndex = (page - 1) * MOVIES_PER_PAGE;
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE);
}

function showMovieModal(id) {
  const modalTitle = document.querySelector("#movie-modal-title");
  const modalImage = document.querySelector("#movie-modal-image");
  const modalDate = document.querySelector("#movie-modal-date");
  const modalDescription = document.querySelector("#movie-modal-description");
  // 新增loading畫面節點與modal圖片監聽器
  const loadingContainer = document.querySelector("#loading-container");
  loadingContainer.style.visibility = "visible";
  modalImage.addEventListener("load", () => {
    loadingContainer.style.visibility = "hidden";
  });

  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results;
    modalTitle.innerText = data.title;
    modalDate.innerText = "Release Date:" + data.release_date;
    modalDescription.innerText = data.description;
    modalImage.src = POSTER_URL + data.image;
  });
}

// 修改addToFavorite函式
function addToFavorite(id) {
  const movie = movies.find((movie) => movie.id === id);
  // if (favoriteList.some((movie) => movie.id === id)) {
  //   return alert("此電影已在收藏清單中！");
  // }
  favoriteList.push(movie);
  localStorage.setItem("favoriteMovies", JSON.stringify(favoriteList));
}
// 新增removeFromFavorite函式
function removeFromFavorite(id) {
  const favoriteIndex = favoriteList.findIndex((movie) => movie.id === id);
  if (favoriteIndex < 0) return;
  favoriteList.splice(favoriteIndex, 1);
  localStorage.setItem("favoriteMovies", JSON.stringify(favoriteList));
}

// 新增add favorite/ remove favorite樣式切換函式
function styleAddFavorite(btn) {
  btn.classList.remove("btn-remove-favorite", "btn-danger");
  btn.classList.add("btn-add-favorite", "btn-info");
  btn.innerText = "+";
}
function styleRemoveFavorite(btn) {
  btn.classList.remove("btn-add-favorite", "btn-info");
  btn.classList.add("btn-remove-favorite", "btn-danger");
  btn.innerText = "x";
}

// 修改onPgeClicked函式 讓使用者知道現在是第幾分頁
paginator.addEventListener("click", function onPageClicked(event) {
  if (event.target.tagName !== "A") return;
  const pageLinks = document.querySelectorAll(".page-link");
  pageLinks.forEach((link) => {
    link.style.color = "black";
    link.style.fontSize = "16px";
  });
  event.target.style.color = "blue";
  event.target.style.fontSize = "20px";
  const page = Number(event.target.dataset.page);
  currentPage = page;
  renderMovieList(getMoviesByPage(currentPage));
});

// 新增按下add favorite與remove favorite的兩種狀況
dataPanel.addEventListener("click", function onPanelClicked(event) {
  if (event.target.matches(".btn-show-movie")) {
    showMovieModal(Number(event.target.dataset.id));
  } else if (event.target.matches(".btn-add-favorite")) {
    addToFavorite(Number(event.target.dataset.id));
    styleRemoveFavorite(event.target);
  } else if (event.target.matches(".btn-remove-favorite")) {
    removeFromFavorite(Number(event.target.dataset.id));
    styleAddFavorite(event.target);
  }
});

searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().toLowerCase();

  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  );
  if (filteredMovies.length === 0) {
    return alert(`找不到有關${keyword}的電影`);
  }
  currentPage = 1;
  renderPaginator(filteredMovies.length);
  renderMovieList(getMoviesByPage(currentPage));
});

axios.get(INDEX_URL).then((response) => {
  movies.push(...response.data.results);
  renderPaginator(movies.length);
  renderMovieList(getMoviesByPage(currentPage));
});

// 新增模式切換監聽器
btnSwitchMode.addEventListener("click", function onSwitchClicked(event) {
  const target = event.target;
  if (target.matches("#btn-card-mode")) {
    mode = "card";
    target.nextElementSibling.style.color = "grey";
    target.nextElementSibling.style.fontSize = "16px";
    target.style.color = "black";
    target.style.fontSize = "20px";
    renderMovieList(getMoviesByPage(currentPage));
  } else if (target.matches("#btn-list-mode")) {
    mode = "list";
    target.previousElementSibling.style.color = "grey";
    target.previousElementSibling.style.fontSize = "16px";
    target.style.color = "black";
    target.style.fontSize = "20px";
    renderMovieList(getMoviesByPage(currentPage));
  }
});
