import { IS_DEBUGGING } from "../constants/index.js";

/**
 * Function to fetch the movieId using the search string from the user
 * @param {string} url 
 * @returns {Promise<[any, null] | [null, Error]>}
 */
export async function apiFetch(url) {
  try {
    const response = await fetch(url);
    const responseData = await response.json();
    if (IS_DEBUGGING) console.log(`Fetched: ${url}\nsearch result: `, responseData);
    if (!response.ok) throw new Error(`Api resonse with ${response.status} ${response.statusText}`)
    return [responseData, null];
  } catch (err) {
    return [null, err];
  }
}
