import { IS_DEBUGGING } from "../constants/index.js";
import { getElement, landingPageEl, resultDisplayEl } from "../utils/elementHelper.js";
import { renderDetails } from "./uiService.js";

const STORAGE_KEY = "movie";
const MAX_HISTORY_DISPLAY = 9;
const historyData = localStorage.getItem(STORAGE_KEY);
const historyArr = historyData ? JSON.parse(historyData) : [];

/**
 * Save data to array and localStorage
 */
export function saveSearchHistory(selectedData, userCategory, seriesData) {
  historyArr.push({ selectedData, userCategory, seriesData });

  // Limit to showing 9 search history
  if (historyArr.length > MAX_HISTORY_DISPLAY) {
    historyArr.shift();
  }
  // Save search history to local storage and render it on the page
  localStorage.setItem(STORAGE_KEY, JSON.stringify(historyArr));
  renderSearchHistory();
}

/**
 * function to render the search history
 */
export function renderSearchHistory() {
  const searchHistoryListEl = getElement("#searchHistory ul", "ul", true);
  searchHistoryListEl.innerHTML = "";

  if (historyArr.length !== 0) {
    getElement("#searchHistory p", "p", true).textContent = "Previous Searches:";
  }

  for (let i = 0; i < historyArr.length; i++) {
    const { selectedData, userCategory, seriesData } = historyArr[i];
    const { poster_path, profile_path, still_path } = selectedData;

    let imgUrl =
      poster_path || profile_path || still_path
        ? `https://image.tmdb.org/t/p/w92${poster_path || profile_path || still_path}`
        : "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg";

    const htmlStr = `
      <li id="history-${i}">
        <img src="${imgUrl}" class='historyItem'>
      </li>`;
    searchHistoryListEl.insertAdjacentHTML("afterbegin", htmlStr);

    getElement(`history-${i}`, "li").addEventListener("click", () => {
      renderDetails(selectedData, userCategory, seriesData);
      if (IS_DEBUGGING) {
        console.log(`Search history: selected ${userCategory} details: `, selectedData);
      }
    });
  }
}

/**
 * Function to add to the browser history list and call renderDetails
 */
export function saveNavHistory(selectedData, userCategory, seriesData) {
  const stateHistory = {
    page: history.state.page + 1,
    selectedData,
    userCategory,
    seriesData
  };

  history.pushState(stateHistory, "", "");
  if (IS_DEBUGGING) {
    console.log("pushState: ", stateHistory);
  }
}

// Listen to back / forward button event
// rerender the page using the data saved in window.history state
// if no history then navigate back to previous website
addEventListener("popstate", () => {
  if (!history.state.page) {
    history.back();
  }

  const { selectedData, userCategory } = history.state;

  if (history.state.page > 1) {
    console.log("before renderDetails in popstate")
    renderDetails(selectedData, userCategory);

  } else {
    landingPageEl.removeAttribute("hidden");
    resultDisplayEl.setAttribute("hidden", "");
  }
});

