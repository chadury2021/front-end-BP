/**
 * Converts a data URL string (e.g., from html2canvas) into a Blob object.
 * @param {string} dataUrl The data URL to convert.
 * @returns {Promise<Blob>} A promise that resolves with the Blob.
 */
export async function dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob;
}
