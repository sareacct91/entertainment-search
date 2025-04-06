import { getElement } from "../utils/elementHelper.js";

export let ytPlayerEl = getElement('youtubePlayer', "div");
/**@type {YT.Player}*/
export let ytPlayer;

/**
 * Create the iframe element for Youtube Player
 */
export function renderYouTubePlayer() {
  ytPlayer = new YT.Player("youtubePlayer", {
    height: `480`,
    width: `640`,
    videoId: "",
    playerVars: {
      playsinline: 1,
    },
    events: {
      onReady: () => {
        // Log out that the YouTube player load correctly
        console.log("YouTube player loaded");

        // Add youtube element selector to the global DOM_SELECTORS object
        ytPlayerEl = getElement('youtubePlayer', "iframe");
        // Hide the video after iframe creation
        ytPlayerEl.setAttribute('hidden', '');

        // resize youtube player size on window resize
        addEventListener("resize", () => {
          playerResize();
        });
      },
      'onStateChange': playerResize
    },
  });
}

/**
 * Function to resize the YouTube player
 */
function playerResize() {
  ytPlayerEl.style.height = `min(${(window.innerWidth * .9) * 9 / 16}px, 720px)`;
  ytPlayerEl.style.width = `min(${window.innerWidth * .9}px, 1280px)`;
};
