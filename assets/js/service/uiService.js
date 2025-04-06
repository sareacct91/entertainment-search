import { IS_DEBUGGING } from "../constants/index.js";
import { getElement, landingPageEl, modalContentEl, resultDisplayEl } from "../utils/elementHelper.js";
import { apiFetch } from "./apiService.js";
import { saveNavHistory, saveSearchHistory } from "./historyService.js";
import { displayCollectionModal, displaySeasonModal, myModal } from "./modalService.js";
import { ytPlayer, ytPlayerEl } from "./youtubeService.js";

const PLACEHOLDER_URL = 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg';
const MAX_DISPLAY_CAST = 10;

const selectedDetailEL = getElement("selectedDetail", "article");
const playerAndStreamEl = getElement("playerAndStream", "div");
const posterImgEl = getElement("posterImg", "img");
const collectionEl = getElement('collection', "figure");
const streamingListEl = getElement('streamingList', "ul");
const streamingContainerEl = getElement('streamingContainer', "div")

export function renderThePage(selectedData, userCategory, seriesData) {
  saveSearchHistory(selectedData, userCategory, seriesData);
  saveNavHistory(selectedData, userCategory, seriesData);
  renderDetails(selectedData, userCategory, seriesData);
  if (IS_DEBUGGING) {
    console.log(`Added to browser history: `, selectedData);
  }
}

export async function renderSelectedDetailPage(selectedId, userCategory) {
  const url = `https://api.themoviedb.org/3/${userCategory}/${selectedId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,content_ratings,combined_credits,external_ids,watch/providers,release_dates`;
  const [selectedData, err] = await apiFetch(url);
  if (err) {
    console.error(err);
    return;
  }
  renderThePage(selectedData, userCategory)
}

export async function renderEpisodeDetailPage(seriesId, seasonNumber, episode_number, seasonDataObj, tvShowDataObj) {
  const episodeUrl =
    `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}/episode/${episode_number}?api_key=a3a4488d24de37de13b91ee3283244ec&language=en-US&append_to_response=credits,videos`;
  const [episodeData, err] = await apiFetch(episodeUrl);
  if (err) {
    console.error(err);
    return;
  }
  renderThePage(episodeData, 'episode', { seriesId, seasonDataObj, tvShowDataObj })
}

/**
 * Main rendering function
 */
export function renderDetails(selectedData, userCategory, seriesData) {
  selectedDetailEL.innerHTML = "";
  const {
    title,
    name,
    poster_path,
    profile_path,
    still_path,
    release_date,
    first_air_date,
    air_date,
    birthday,
    place_of_birth,
    overview,
    biography,
    content_ratings,
    release_dates,
    credits,
    runtime,
    seasons,
    belongs_to_collection,
    videos,
    id: selectedId,
    ["watch/providers"]: streamingProviders
  } = selectedData;

  // Render the profile/poster for user selected choice
  posterImgEl.src = poster_path || profile_path || still_path
    ? `https://image.tmdb.org/t/p/w342${poster_path || profile_path || still_path}`
    : PLACEHOLDER_URL;

  // render different details depending on search category (movie, tv or person)
  // render Movie/TV details
  if (userCategory !== "person") {
    playerAndStreamEl.removeAttribute("hidden");
    const videoHtmlStr =
      `<h2>${title || name}</h2>
      <h3>Plot Summary</h3>
      <p>${overview}</p>
      <h3>Release Date: <span>${release_date || first_air_date || air_date}</span></h3>
      <h3>Rating: <span id="rating">N/A</span></h3>
      <h3>Runtime: <span id="runtime"> ${runtime} mins</span></h3>
      <ul id="directorsList" class="row gap"></ul>
      <ul id="castList" class="row gap"></ul>
      <ul id="seasonsList" class="row gap"></ul>`;
    selectedDetailEL.insertAdjacentHTML("beforeend", videoHtmlStr);

    // load a YT trailer for the selected tv/movie if exist
    videos.results.length !== 0
      ? loadTrailer(videos.results)
      // @ts-ignore
      : playerAndStreamEl.firstElementChild.setAttribute('hidden', '');

    // Get the right response data for rating and render
    if (userCategory !== 'episode') {
      const ratings = userCategory === "movie"
        ? release_dates.results
        : content_ratings.results;
      renderRating(ratings);
    }

    // If seasons exist, ie. a tv show with multiple seasons
    if (seasons) {
      renderTvSeasonList(selectedId, seasons, selectedData);
    }

    // Render Movie && episode Director
    if (userCategory !== "tv") {
      renderMovieDirector(credits.crew);
    }
    // Render cast list for Move, Tv, and episode
    renderMovieTvCastList(credits.cast);

    // If selected movie / tv is available to stream online
    // else hide the streaming option section
    if (userCategory !== 'episode') {
      streamingProviders.results.US
        ? renderStreamingOption(streamingProviders.results.US, name || title)
        : streamingContainerEl.setAttribute('hidden', '');
    } else {
      streamingContainerEl.setAttribute('hidden', '');
    }

    // render collection if exist
    collectionEl.textContent = '';
    if (belongs_to_collection || seriesData) {
      renderCollectionOrSeason(userCategory, seriesData, belongs_to_collection);
    }

    // render Person details
  } else {
    playerAndStreamEl.setAttribute("hidden", "");
    const personHtmlStr = `
      <h2>${name}</h2>
      <h3>Biography</h3>
      <p>${biography}</p>
      <h3>Birthday: <span>${birthday}</span></h3>
      <h3>Place of Birth: <span>${place_of_birth}</span></h3>
      <ul id="castList" class="row"></ul>
      <ul id="crewList" class="row"></ul>`;
    selectedDetailEL.insertAdjacentHTML("beforeend", personHtmlStr);
    const { cast, crew } = selectedData.combined_credits;
    // Display the cast and crew credits for selected person
    renderPersonCastCredits(cast);
    renderPersonCrewCredits(crew);
  }

  // Hide landing page and show result page and scroll to the top of the page on render
  landingPageEl.setAttribute("hidden", "");
  resultDisplayEl.removeAttribute("hidden");
  posterImgEl.scrollIntoView({ behavior: "smooth" });
}

// helper functions 

/**
 * Function to load the offical trailer on the youtube player
 */
function loadTrailer(videosArr) {
  const trailerModalBtnEl = getElement('trailerModalBtn', "button");
  trailerModalBtnEl.removeAttribute('hidden');

  // Default to the 1st video in the array
  // TODO: think about it
  let trailerKey = videosArr[0].key;

  // Loop through the array for an offical trailer video if exist
  for (let i = 0; i < videosArr.length; i++) {
    const { name, key } = videosArr[i];

    if (
      name.toUpperCase().includes("TRAILER") &&
      !name.toUpperCase().includes("TEASER")
    ) {
      trailerKey = key;
      if (name.toUpperCase().includes("OFFICIAL")) {
        trailerKey = key;
        break;
      }
    }
  }
  ytPlayer.cueVideoById(trailerKey);

  // Event listener for play trailer button
  trailerModalBtnEl.addEventListener('click', () => {
    ytPlayerEl.removeAttribute("hidden");
    modalContentEl.style = 'background-color: black; width: min-content;'
    // @ts-ignore
    modalContentEl.parentElement.style.maxWidth = 'min-content';
    myModal.show();
    ytPlayer.playVideo();
  });
}

/**
 * Function to render the rating of Movie/Tv show
 */
function renderRating(ratingsArr) {
  // This element is created during renderDetails not in index.html
  const ratingEl = getElement("rating", "span");

  // Loop through the rating array for the correct rating
  for (let i = 0; i < ratingsArr.length; i++) {
    let { rating, iso_3166_1, release_dates } = ratingsArr[i];

    if (iso_3166_1 === "US") {
      // If rating doesn't exist, ie. this is a call from a movie selection
      // Loop through the release_dates array for the rating
      if (!rating) {
        release_dates.forEach((obj) => {
          rating = obj.certification;
        });
      }
      // Render the rating on the page and quit the function
      ratingEl.textContent = `${rating}`;
    }
  }
}

/**
 * Function to render the seasons list
 */
function renderTvSeasonList(selectedId, seasons, selectedData) {
  // This element is created during renderDetails not in index.html
  const tvSeasonsEl = getElement("seasonsList", "ul");
  tvSeasonsEl.insertAdjacentHTML("beforebegin", "<h3>Seasons information</h3>");

  for (let i = 1; i < seasons.length; i++) {
    const { name, poster_path, episode_count, season_number } = seasons[i];

    const seasonDetailHtml =
      `<li class='col align-center'>
          <p>${name}</p>
          <img id="seasonListItem-${i}" class="hover" src="https://image.tmdb.org/t/p/w92${poster_path}">
          <p>Episode Count: ${episode_count}</p>
        </li>`;
    tvSeasonsEl.insertAdjacentHTML("beforeend", seasonDetailHtml);

    getElement(`seasonListItem-${i}`, "img").addEventListener('click', async () => {
      const fetchUrl =
        `https://api.themoviedb.org/3/tv/${selectedId}/season/${season_number}?api_key=a3a4488d24de37de13b91ee3283244ec&language=en-US&append_to_response=images`;
      const [seasonData, err] = await apiFetch(fetchUrl)
      if (err) {
        console.error(err);
        return;
      }
      displaySeasonModal(selectedId, season_number, seasonData, selectedData);
    });
  }
}

/**
 * Function to render the director list and listen to click on their image to give more detail on them.
 */
function renderMovieDirector(crewsArr) {
  // This element is created during renderDetails not in index.html
  const directorEl = getElement("directorsList", "ul");
  const resultArr = crewsArr.filter((crewMember) => crewMember.job === 'Director');

  directorEl.insertAdjacentHTML("beforebegin", "<h3>Director:</h3>");
  for (let i = 0; i < resultArr.length; i++) {
    const { id, name, profile_path } = resultArr[i];
    const imgUrl = profile_path
      ? `https://image.tmdb.org/t/p/w92${profile_path}`
      : PLACEHOLDER_URL;
    const directorHtmlStr =
      `<li>
          <img id="director-${i}" class="hover" src="${imgUrl}">
          <p>${name}</p>
        </li>`;
    directorEl.insertAdjacentHTML("beforeend", directorHtmlStr);

    // Event Listener for click on the director img
    getElement(`director-${i}`, "img").addEventListener('click', async () => {
      await renderSelectedDetailPage(id, 'person');
    })
  }
}

/**
 * Function to render list of streaming websites
 */
function renderStreamingOption(providersObj, searchName) {

  // Function to return li elements to be inserted
  const insertLi = streamingSiteArr => {
    let liHtmlStr = "";
    for (let i = 0; i < streamingSiteArr.length; i++) {
      const imgUrl = `https://image.tmdb.org/t/p/w45${streamingSiteArr[i].logo_path}`;
      liHtmlStr +=
        `<li>
          <a href="https://www.google.com/search?q=watch ${searchName}" target="_blank">
          <img src="${imgUrl}" alt="icon of streaming service"></a>
        </li>`;
    }
    return liHtmlStr;
  }

  streamingContainerEl.removeAttribute('hidden');
  streamingListEl.textContent = '';

  for (let key in providersObj) {
    if (key === "link") {
      continue;
    }
    const ulHtmlStr = `
        <h4>${key}</h4>
        <ul>${insertLi(providersObj[key])}</ul>`
    streamingListEl.insertAdjacentHTML("beforeend", ulHtmlStr);
  }
}

/**
 * Function that renders Collection or Seasons information for a movie / tv show
 */
function renderCollectionOrSeason(userCategory, seriesData, belongs_to_collection) {
  if (userCategory === 'movie') {
    const {
      id: collectionId,
      name,
      poster_path,
    } = belongs_to_collection;
    const imgUrl = `https://image.tmdb.org/t/p/w185${poster_path}`
    const collectionHtmlStr = `
        <figcaption>Part of the ${name}</figcaption>
        <img id="collectionImg" class="clickable" src="${imgUrl}">`
    collectionEl.insertAdjacentHTML('beforeend', collectionHtmlStr);

    // Event listener on click of collection img
    getElement('collectionImg', "img").addEventListener('click', () => {
      displayCollectionModal(collectionId);
    });
  } else if (userCategory === 'episode') {
    const { seriesId, seasonDataObj, tvShowDataObj } = seriesData;
    const { name, poster_path, season_number } = seasonDataObj;
    const imgUrl = `https://image.tmdb.org/t/p/w185${poster_path}`
    const collectionHtmlStr = `
        <img id="tvShowPoster" class="clickable" src="https://image.tmdb.org/t/p/w185${tvShowDataObj.poster_path}">
        <figcaption>${name}</figcaption>
        <img id="seasonPoster" class="clickable" src="${imgUrl}">`
    collectionEl.insertAdjacentHTML('beforeend', collectionHtmlStr);

    // dynamic eventListeners
    getElement('tvShowPoster', "img").addEventListener('click', () => {
      renderThePage(tvShowDataObj, "tv");
    });
    getElement('seasonPoster', "img").addEventListener('click', () => {
      displaySeasonModal(seriesId, season_number, seasonDataObj, tvShowDataObj)
    });
  }
};

/**
 * Function to render the cast list and listen to click on their image to give more detail on them.
 */
function renderMovieTvCastList(castArr) {
  // This element is created during renderDetails not in index.html
  const castListEl = getElement("castList", "ul");

  castListEl.insertAdjacentHTML("beforebegin", "<h3>Cast: </h3>");
  for (let i = 0; i < MAX_DISPLAY_CAST && i < castArr.length; i++) {
    const imgUrl = castArr[i].profile_path
      ? `https://image.tmdb.org/t/p/w92${castArr[i].profile_path}`
      : PLACEHOLDER_URL;
    const htmlStr =
      `<li class="col align-center" >
          <img id="cast-${i}" class="hover" src="${imgUrl}">
          <p>${castArr[i].name}</p>
          <p>${castArr[i].character}</p>
        </li>`;
    castListEl.insertAdjacentHTML("beforeend", htmlStr);

    // dynamic eventListeners
    getElement(`cast-${i}`, "img").addEventListener("click", async () => {
      await renderSelectedDetailPage(castArr[i].id, "person");
    });
  }
}

/**
 * Function to render cast credits for Person searches
 */
function renderPersonCastCredits(castsArr) {
  // This element is created during renderDetails not in index.html
  const castUlEl = getElement("castList", "ul");
  // Sort the cast by newest releases
  castsArr.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  // hiding cast UL element if none exist and exit function
  if (castsArr.length === 0) {
    castUlEl.setAttribute("hidden", "");
    return;
  }

  castUlEl.insertAdjacentHTML("beforebegin", "<h3>Cast Credits: </h3>");
  // use castLimit to make sure that we have the max amount of casts display
  // this number need to increase whenever we skip a cast member
  let castLimit = MAX_DISPLAY_CAST;
  for (let i = 0; i < castsArr.length && i < castLimit; i++) {
    const { character, id, media_type, title, poster_path } = castsArr[i];
    const imgUrl = poster_path
      ? `https://image.tmdb.org/t/p/w92${poster_path}`
      : PLACEHOLDER_URL;
    // TODO: use placeholder instead?
    // skip cast with no poster image
    if (!poster_path) {
      castLimit++;
      continue;
    }
    const htmlStr = `
        <li>
          <img id="cast-${id}" class="hover" src="${imgUrl}" alt="${title} Movie Poster">
          <h4>${title}</h4>
          <p>Character: <strong>${character || 'Self'}</strong></p>
        </li>`;
    castUlEl.insertAdjacentHTML("beforeend", htmlStr);

    // dynamic eventListeners
    getElement(`cast-${id}`, "img").addEventListener("click", async () => {
      await renderSelectedDetailPage(id, media_type);
    });
  }
}

/**
 * Function to render crew credits for Person searches
 */
function renderPersonCrewCredits(crewsArr) {
  // This element is created during renderDetails not in index.html
  const crewUl = getElement("crewList", "ul");
  // Sort the crew by newest releases
  crewsArr.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  // hiding crew UL element if none exist and exit function
  if (crewsArr.length === 0) {
    crewUl.setAttribute("hidden", "");
    return;
  }

  // Limit the list to 10 crew members
  let crewLimit = 10;
  // create crewArray for purposes of looking for duplicate credits
  let pickedCrewArr = [];
  // deconstruct crew object & get 10 crew credits - combining duplicates into one listing with multiple jobs
  for (let i = 0; i < crewsArr.length && i < crewLimit; i++) {
    const { job, title, poster_path } = crewsArr[i];
    let duplicate = false;

    // Look for duplicate crew member, if found combine their job credit
    pickedCrewArr.forEach((pickedCrew) => {
      if (pickedCrew.title === title) {
        pickedCrew.job += ", " + job;
        duplicate = true;
      }
    });
    if (!poster_path || duplicate) {
      crewLimit++;
      continue;
    }
    pickedCrewArr.push(crewsArr[i]);
  }
  crewUl.insertAdjacentHTML("beforebegin", "<h3>Crew Credits: </h3>");

  pickedCrewArr.forEach((crew) => {
    const { job, title, id, media_type, poster_path } = crew;
    const imgUrl = poster_path
      ? `https://image.tmdb.org/t/p/w92${poster_path}`
      : PLACEHOLDER_URL;
    const htmlStr = `
        <li>
          <img id="crew-${id}" class="hover" src="${imgUrl}" alt="${title} Movie Poster">
          <p>${title}</p>
          <p>Job: ${job}</p>
        </li>`;
    crewUl.insertAdjacentHTML("beforeend", htmlStr);

    // Event listener for click on the profile image
    getElement(`crew-${id}`, "img").addEventListener("click", async () => {
      await renderSelectedDetailPage(id, media_type);
    });
  });
}
