import "./searchFormHandler.js";
import { renderYouTubePlayer } from "./service/youtubeService.js";
import { saveNavHistory, renderSearchHistory } from "./service/historyService.js";

// Init on DOM ready
addEventListener("DOMContentLoaded", () => {
  renderSearchHistory();
  history.pushState({ page: 0 }, "", "");
  saveNavHistory();
});

addEventListener("load", () => {
  renderYouTubePlayer();
});
