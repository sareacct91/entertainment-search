import { IS_DEBUGGING } from "../constants/index.js";
import { getElement, modalContentEl, modalHeaderEl, modalListEl, modalTextEl, myModalEl } from "../utils/elementHelper.js";
import { apiFetch } from "./apiService.js";
import { renderEpisodeDetailPage, renderSelectedDetailPage } from "./uiService.js";
import { ytPlayerEl, ytPlayer } from "./youtubeService.js";

const MODAL_MAX_WIDTH = '90vw';
const MAX_ITEM_DISPLAY = 5;

// @ts-ignore
export const myModal = new bootstrap.Modal(myModalEl);

// Event listener on modal closing, reset modal to default
myModalEl.addEventListener('hide.bs.modal', () => {
  ytPlayer.pauseVideo();
  ytPlayerEl.setAttribute('hidden', '');

  modalContentEl.style.removeProperty("background-color");
  modalContentEl.style.removeProperty("width");
  // @ts-ignore
  modalContentEl.parentElement.style.maxWidth = '500px';

  modalHeaderEl.textContent = '';
  modalTextEl.textContent = '';
  modalListEl.textContent = '';
});

/** 
 * function to display results of search - allow user to select specific one
 */
export function displaySearchResultModal(resultsArr, userCategory) {
  modalHeaderEl.textContent = `Choose the Specific ${userCategory.toUpperCase()}`;

  if (IS_DEBUGGING) {
    console.log(resultsArr);
  }

  // create and append possible matches to user query
  for (let i = 0; i < MAX_ITEM_DISPLAY && i < resultsArr.length; i++) {
    const {
      name,
      original_title,
      profile_path,
      poster_path,
      release_date,
      first_air_date,
    } = resultsArr[i];

    const nameData = name || original_title;
    const imageUrl = profile_path || poster_path;
    const date = release_date || first_air_date || "N/A";

    const top5Str = `
        <li id="thumbnail-${i}" class="clickable">
          <div class="pure-g">
            <div class="pure-u-1-3"><img src="https://image.tmdb.org/t/p/w92${imageUrl}"></div>
            <div class="pure-u-2-3 col justify-around">
              <h3>${nameData}</h3>
              <p>Release Date: ${date}</p>
            </div>
          </div>
        </li>`;
    modalListEl.insertAdjacentHTML("beforeend", top5Str);

    // add eventlistener to each li item for user to select then pass that specific movie id to fetchTmdbMovieDetail function
    getElement(`thumbnail-${i}`, "li").addEventListener("click", async () => {
      const { id: selectedId } = resultsArr[i];
      await renderSelectedDetailPage(selectedId, userCategory);
      myModal.hide();
    });
  }

  myModal.show();
};

export async function displayCollectionModal(collectionId) {
  const collectionUrl = `https://api.themoviedb.org/3/collection/${collectionId}?api_key=a3a4488d24de37de13b91ee3283244ec&language=en-US`
  const [collectionData, err] = await apiFetch(collectionUrl)
  if (err) {
    console.error(err);
    return;
  }
  const { name, overview, parts } = collectionData;
  modalHeaderEl.textContent = name;
  if (overview) {
    modalHeaderEl.insertAdjacentHTML('beforeend', `<h4 style="font-size: .8em;">Collection Overview: <p style="font-weight: 400; font-size: 16px;">${overview}</p></h4>`)
  }

  // Loop through the collection and display the list in modal body
  parts.forEach(movieObj => {
    const {
      id: movieId,
      title,
      overview,
      poster_path,
      media_type,
      release_date
    } = movieObj;

    // Skip the list item if no release date
    if (!release_date) {
      return;
    }

    const imgUrl = `https://image.tmdb.org/t/p/w92${poster_path}`;
    const moiveHtmlStr = `
        <li id="thumbnail-${movieId}" class="clickable">
          <div class="pure-g">
            <div class="pure-u-1-3"><img src="${imgUrl}"></div>
            <div class="pure-u-2-3 col justify-around">
              <h3>${title}</h3>
              <p>Release Date: ${release_date}</p>
              <p>Plot Summary: ${overview}</p>
            </div>
          </div>
        </li>`;
    modalListEl.insertAdjacentHTML('beforeend', moiveHtmlStr);

    // Event listener on click of modal list item
    getElement(`thumbnail-${movieId}`, "li").addEventListener('click', async  () => {
      await renderSelectedDetailPage(movieId, media_type);
      myModal.hide();
    });
  });
  // @ts-ignore
  modalContentEl.parentElement.style.maxWidth = MODAL_MAX_WIDTH;
  myModal.show();
}

// This function is called after fetching the data about the selected season
export function displaySeasonModal(seriesId, seasonNumber, seasonDataObj, tvShowDataObj) {
  const { episodes, name, overview } = seasonDataObj;
  modalHeaderEl.textContent = `${name}`;
  if (overview) {
    modalHeaderEl.insertAdjacentHTML('beforeend', `<h4 style="font-size: .8em;">Season Overview: <p style="font-weight: 400; font-size: 16px;">${overview}</p></h4>`)
  }
  modalListEl.insertAdjacentHTML('beforeend', `<h3 class="text-center">EPISODES</h3><br>`);

  episodes.forEach((episodeOjb, i) => {
    const { air_date, name, overview, still_path, episode_number } = episodeOjb;
    const imgUrl = still_path ? `https://image.tmdb.org/t/p/w185${still_path}` : ``;
    const episodeHtmlStr = `
      <li id="episode-${i}" class="clickable">
        <div class="pure-g">
          <div class="pure-u-1 pure-u-md-1-3 col align-center"><img class="pure-img" src="${imgUrl}"></div>
          <div class="pure-u-1 pure-u-md-2-3 col justify-around align-start gap">
            <h4>${episode_number}.${name}</h4>
            <h5>Release Date: <span>${air_date}</span></h5>
            <h5>Episode Overview:</h5>
            <p class="text-left">${overview}</p><br>
          </div>
        </div>
      </li>`;
    modalListEl.insertAdjacentHTML('beforeend', episodeHtmlStr);

    // Event listener on click of an episode on the modal
    getElement(`episode-${i}`, "li").addEventListener('click', () => {
      renderEpisodeDetailPage(seriesId, seasonNumber, episode_number, seasonDataObj, tvShowDataObj);
      myModal.hide();
    });
  });

  // @ts-ignore
  modalContentEl.parentElement.style.maxWidth = MODAL_MAX_WIDTH;
  myModal.show();
};
