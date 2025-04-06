import { getElement, modalHeaderEl, modalTextEl } from "./utils/elementHelper.js";
import { displaySearchResultModal, myModal } from "./service/modalService.js";
import { apiFetch } from "./service/apiService.js";
import { renderSelectedDetailPage } from "./service/uiService.js";

const searchFormEL = getElement("searchForm", "form");
const searchSelectEl = getElement("mediaSelect", "select");
const searchInputEl = getElement("searchInput", "input");

searchFormEL.addEventListener("submit", async (evt) => {
  evt.preventDefault();

  const userCategory = searchSelectEl.value;
  const userInput = searchInputEl.value.trim();

  if (!userInput || !userCategory) {
    modalHeaderEl.textContent = "Warning";
    modalTextEl.innerHTML = "Please enter a <strong>Search Category</strong> AND a valid <strong>Title</strong> or <strong>Person Name</strong>";
    myModal.show();
    return;
  }

  searchSelectEl.value = "";
  searchInputEl.value = "";

  const searchUrl = `https://api.themoviedb.org/3/search/${userCategory}?query=${userInput}&page=1&api_key=a3a4488d24de37de13b91ee3283244ec`;
  const [responseData, err] = await apiFetch(searchUrl);
  if (err) {
    console.error(err);
    return;
  }

  if (responseData.results.length > 1) {
    displaySearchResultModal(responseData.results, userCategory);

  } else if (responseData.results.length === 1) {
    await renderSelectedDetailPage(responseData.results[0].id, userCategory);

  } else {
    modalHeaderEl.textContent = "Warning";
    modalTextEl.textContent = "Could not find any exact matches - please check your spelling!";
    myModal.show();
    return;
  }
});

